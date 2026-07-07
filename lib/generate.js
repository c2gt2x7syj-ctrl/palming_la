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

function formatBrand(brand) {
  const normalized = normalizeText(brand);
  if (!normalized || /nao informado|não informado/i.test(normalized)) {
    return "";
  }
  return normalized;
}

export function buildHeuristicResult(data) {
  const category = normalizeText(data.category);
  const customName = normalizeText(data.productName);
  const brand = formatBrand(data.brand);
  const color = normalizeText(data.color);
  const size = normalizeText(data.size);
  const condition = normalizeText(data.condition);
  const measures = normalizeText(data.measures);
  const details = normalizeText(data.notes);

  const descriptor = [brand, color, size].filter(Boolean).join(" ").trim();
  const baseName = customName || category || "produto vintage";
  const suggestedTitle = [baseName, descriptor].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  const summary = [
    titleCase(baseName),
    brand ? `da marca ${brand}` : "",
    color ? `em ${color}` : ""
  ].filter(Boolean).join(" ");

  const descriptionParts = [
    `${summary}.`.replace(/\s+/g, " ").trim(),
    condition ? `Estado informado: ${condition}.` : "Estado de conservacao a confirmar.",
    measures ? `Medidas: ${measures}.` : "Adicionar medidas ajuda bastante na conversao.",
    details ? `Observacoes: ${details}.` : "Descreva avarias, tecido, caimento e detalhes de uso para aumentar a confianca."
  ];

  let hotScore = 2;
  if (brand) hotScore += 1;
  if (measures) hotScore += 1;
  if (condition && /novo|otimo|ótimo|excelente|muito bom/i.test(condition)) hotScore += 1;
  hotScore = Math.min(5, hotScore);

  const reasons = [
    brand ? "Marca preenchida melhora busca e confianca." : "Marca ausente reduz forca de busca.",
    measures ? "Medidas informadas ajudam a destravar decisao." : "Sem medidas, a conversao tende a cair.",
    condition ? "Estado do item ja esta declarado." : "Detalhar o estado do item tende a aumentar a confianca."
  ];

  const instagramHook = `${titleCase(baseName)} garimpado para quem gosta de peca com personalidade.`;
  const instagramCaption = [
    `${titleCase(baseName)}${brand ? ` da ${brand}` : ""}${color ? ` em ${color}` : ""}.`,
    condition ? `Estado: ${condition}.` : "Estado sob consulta.",
    measures ? `Medidas: ${measures}.` : "Vale incluir medidas no post para acelerar respostas no direct.",
    "Se quiser, chame no direct para reserva ou envio do link na Enjoei."
  ].join(" ");
  const instagramCta = "Comente ou chame no direct para receber o link da peca.";
  const instagramHashtags = [
    "#palmingbrecho",
    "#brecho",
    "#modavintage",
    category ? `#${category.toLowerCase().replace(/[^a-z0-9]+/g, "")}` : "#garimpo",
    brand ? `#${brand.toLowerCase().replace(/[^a-z0-9]+/g, "")}` : "#achado"
  ].filter(Boolean);
  const instagramTips = [
    "Abrir com uma frase curta e objetiva sobre a peca.",
    "Destacar medidas ou caimento ja nas primeiras linhas.",
    "Fechar com chamada para direct ou link da Enjoei."
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
    instagramHook,
    instagramCaption,
    instagramCta,
    instagramHashtags,
    instagramTips,
    source: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? "model_fallback" : "heuristic"
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
  "photoReview": ["string", "string", "string"],
  "instagramHook": "string",
  "instagramCaption": "string",
  "instagramCta": "string",
  "instagramHashtags": ["string", "string", "string", "string", "string"],
  "instagramTips": ["string", "string", "string"]
}

Regras:
- O titulo deve ser curto, claro e buscavel.
- A descricao deve ser pronta para colar no anuncio.
- A nota hotScore vai de 1 a 5 e mede o potencial de venda quente.
- O bloco de Instagram deve vir com texto mais direto, bom para legenda e conversao em direct.
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

export async function generateWithOpenAI(data) {
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
    instagramHook: parsed.instagramHook,
    instagramCaption: parsed.instagramCaption,
    instagramCta: parsed.instagramCta,
    instagramHashtags: Array.isArray(parsed.instagramHashtags) ? parsed.instagramHashtags.slice(0, 5) : [],
    instagramTips: Array.isArray(parsed.instagramTips) ? parsed.instagramTips.slice(0, 3) : [],
    source: "openai"
  };
}

function dataUrlToInlineData(dataUrl) {
  const match = String(dataUrl || "").match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2]
  };
}

export async function generateWithGemini(data) {
  if (!process.env.GEMINI_API_KEY) {
    return buildHeuristicResult(data);
  }

  const parts = [{ text: buildPrompt(data) }];
  const inlineData = dataUrlToInlineData(data.imageDataUrl);

  if (inlineData) {
    parts.push({
      inlineData
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || "gemini-3.1-flash-lite")}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const outputText =
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  const jsonMatch = outputText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Gemini response did not contain valid JSON.");
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
    instagramHook: parsed.instagramHook,
    instagramCaption: parsed.instagramCaption,
    instagramCta: parsed.instagramCta,
    instagramHashtags: Array.isArray(parsed.instagramHashtags) ? parsed.instagramHashtags.slice(0, 5) : [],
    instagramTips: Array.isArray(parsed.instagramTips) ? parsed.instagramTips.slice(0, 3) : [],
    source: "gemini"
  };
}

export async function generateResult(data) {
  try {
    if (process.env.GEMINI_API_KEY) {
      return await generateWithGemini(data);
    }

    if (process.env.OPENAI_API_KEY) {
      return await generateWithOpenAI(data);
    }

    return buildHeuristicResult(data);
  } catch (error) {
    try {
      if (process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
        return await generateWithOpenAI(data);
      }

      if (process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY) {
        return await generateWithOpenAI(data);
      }
    } catch (secondaryError) {
      return {
        ...buildHeuristicResult(data),
        warning: `${error.message} | ${secondaryError.message}`
      };
    }

    return {
      ...buildHeuristicResult(data),
      warning: error.message
    };
  }
}
