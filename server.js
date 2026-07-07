import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = join(process.cwd(), "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function titleCase(value) {
  return normalizeText(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildHeuristicResult(data) {
  const category = normalizeText(data.category);
  const customName = normalizeText(data.productName);
  const brand = normalizeText(data.brand);
  const color = normalizeText(data.color);
  const size = normalizeText(data.size);
  const condition = normalizeText(data.condition);
  const measures = normalizeText(data.measures);
  const details = normalizeText(data.notes);

  const descriptor = [brand, color, size].filter(Boolean).join(" ").trim();
  const baseName = customName || category || "produto vintage";
  const suggestedTitle = [baseName, descriptor].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  const descriptionParts = [
    `${titleCase(baseName)} ${brand ? `da marca ${brand}` : ""}${color ? ` em ${color}` : ""}.`.replace(/\s+/g, " ").trim(),
    condition ? `Estado informado: ${condition}.` : "Estado de conservacao a confirmar.",
    measures ? `Medidas: ${measures}.` : "Adicionar medidas ajuda bastante na conversao.",
    details ? `Observacoes: ${details}.` : "Descreva avarias, tecido, caimento e detalhes de uso para aumentar a confianca."
  ];

  let hotScore = 2;
  if (brand) hotScore += 1;
  if (measures) hotScore += 1;
  if (condition && /novo|otimo|excelente|muito bom/i.test(condition)) hotScore += 1;
  hotScore = Math.min(5, hotScore);

  const reasons = [
    brand ? "Marca preenchida melhora busca e confianca." : "Marca ausente reduz forca de busca.",
    measures ? "Medidas informadas ajudam a destravar decisao." : "Sem medidas, a conversao tende a cair.",
    condition ? "Estado do item ja esta declarado." : "Detalhar o estado do item tende a aumentar a confianca."
  ];

  return {
    suggestedTitle: titleCase(suggestedTitle || "Produto Vintage"),
    alternateTitles: [
      titleCase([category, brand, color].filter(Boolean).join(" ") || baseName),
      titleCase([baseName, condition].filter(Boolean).join(" ")),
      titleCase([category, color, size].filter(Boolean).join(" ") || baseName)
    ].filter((value, index, list) => value && list.indexOf(value) === index),
    description: descriptionParts.join(" "),
    hotScore,
    hotLabel:
      hotScore >= 5 ? "Venda muito quente" :
      hotScore >= 4 ? "Venda quente" :
      hotScore >= 3 ? "Venda moderada" :
      "Venda de giro mais lento",
    scoreReasons: reasons,
    photoReview: [
      "Usar uma foto principal sem interface do Instagram.",
      "Centralizar o produto e reduzir elementos do fundo.",
      "Adicionar detalhe de etiqueta, textura e possiveis avarias."
    ],
    source: "fallback"
  };
}

function buildPrompt(data) {
  return `
Voce e um especialista em anuncios para a Enjoei, com foco em brecho curado, vintage e itens de moda ou colecionaveis.

Analise o produto e responda em JSON valido com esta estrutura:
{
  "suggestedTitle": "string",
  "alternateTitles": ["string", "string", "string"],
  "description": "string",
  "hotScore": 1,
  "hotLabel": "string",
  "scoreReasons": ["string", "string", "string"],
  "photoReview": ["string", "string", "string"]
}

Regras:
- O titulo deve ser curto, claro e buscavel.
- A descricao deve ser pronta para colar no anuncio.
- A nota hotScore vai de 1 a 5 e mede o potencial de venda quente.
- Nao invente marca, material ou defeitos se nao forem visiveis ou informados.
- Se a imagem for print do Instagram, considere isso e sugira melhoria de foto.

Dados informados:
- Nome do produto: ${normalizeText(data.productName) || "nao informado"}
- Categoria: ${normalizeText(data.category) || "nao informada"}
- Marca: ${normalizeText(data.brand) || "nao informada"}
- Cor: ${normalizeText(data.color) || "nao informada"}
- Tamanho: ${normalizeText(data.size) || "nao informado"}
- Estado: ${normalizeText(data.condition) || "nao informado"}
- Medidas: ${normalizeText(data.measures) || "nao informadas"}
- Observacoes: ${normalizeText(data.notes) || "nao informadas"}
`.trim();
}

async function generateWithOpenAI(data) {
  if (!process.env.OPENAI_API_KEY) {
    return buildHeuristicResult(data);
  }

  const input = [
    {
      role: "user",
      content: [
        { type: "input_text", text: buildPrompt(data) }
      ]
    }
  ];

  if (data.imageDataUrl) {
    input[0].content.push({
      type: "input_image",
      image_url: data.imageDataUrl,
      detail: "high"
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText = payload.output_text || "";
  const jsonMatch = outputText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Model response did not contain valid JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    suggestedTitle: parsed.suggestedTitle,
    alternateTitles: Array.isArray(parsed.alternateTitles) ? parsed.alternateTitles.slice(0, 3) : [],
    description: parsed.description,
    hotScore: Math.max(1, Math.min(5, Number(parsed.hotScore) || 1)),
    hotLabel: parsed.hotLabel,
    scoreReasons: Array.isArray(parsed.scoreReasons) ? parsed.scoreReasons.slice(0, 3) : [],
    photoReview: Array.isArray(parsed.photoReview) ? parsed.photoReview.slice(0, 3) : [],
    source: "openai"
  };
}

async function serveFile(pathname, res) {
  const filePath = pathname === "/" ? join(PUBLIC_DIR, "index.html") : join(PUBLIC_DIR, pathname);
  const extension = extname(filePath);
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const file = await readFile(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(file);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/generate") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body || "{}");
          const result = await generateWithOpenAI(data);
          sendJson(res, 200, result);
        } catch (error) {
          const fallback = buildHeuristicResult(JSON.parse(body || "{}"));
          sendJson(res, 200, {
            ...fallback,
            warning: error.message
          });
        }
      });
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    await serveFile(req.url, res);
  } catch (error) {
    sendJson(res, 404, { error: "Not found" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Agente Enjoei rodando em http://${HOST}:${PORT}`);
});
