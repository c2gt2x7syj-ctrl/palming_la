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

function normalizeProductType(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (/disco|vinil|lp|cd/.test(normalized)) return "disco";
  if (/eletron|camera|câmera|aparelho|audio|áudio|video|vídeo|filmadora|radio|rádio/.test(normalized)) {
    return "eletronico";
  }
  return "roupa";
}

function buildTypeCopy(productType) {
  if (productType === "disco") {
    return {
      fallbackName: "disco vintage",
      measureLine: "Informar formato, edicao e estado da midia ajuda bastante na conversao.",
      detailLine: "Descreva selo, prensagem, encarte, capa e marcas de uso para aumentar a confianca.",
      reasons: [
        "Marca, selo ou artista fortalecem a busca do item.",
        "Estado da capa e da midia ajuda a destravar a compra.",
        "Edicao, genero ou prensagem aumentam o valor percebido."
      ],
      photoReview: [
        "Usar uma foto frontal limpa da capa, sem interface do Instagram.",
        "Adicionar fotos do verso, encarte, selo e estado da capa.",
        "Se houver marcas de uso, mostrar isso com nitidez."
      ],
      instagramTips: [
        "Abrir com artista, album ou genero para prender quem coleciona.",
        "Destacar edicao, estado da capa e estado da midia nas primeiras linhas.",
        "Fechar com chamada para direct ou link da Enjoei."
      ],
      cta: "Comente ou chame no direct para receber o link desse disco."
    };
  }

  if (productType === "eletronico") {
    return {
      fallbackName: "item eletronico vintage",
      measureLine: "Informar modelo, voltagem, funcionamento e acessorios ajuda bastante na conversao.",
      detailLine: "Descreva testes, sinais de uso, acessorios inclusos e qualquer detalhe tecnico relevante.",
      reasons: [
        "Modelo e marca aumentam a precisao da busca.",
        "Funcionamento descrito reduz inseguranca na compra.",
        "Acessorios, voltagem e estado geral aumentam a confianca."
      ],
      photoReview: [
        "Usar uma foto principal limpa do aparelho, sem interface do Instagram.",
        "Adicionar fotos de portas, cabos, etiqueta do modelo e acessorios.",
        "Se possivel, incluir imagem do item ligado ou em teste."
      ],
      instagramTips: [
        "Abrir com o nome do aparelho e o estado de funcionamento.",
        "Destacar modelo, acessorios e teste feito logo no inicio.",
        "Fechar com chamada para direct ou link da Enjoei."
      ],
      cta: "Chame no direct para receber o link e os detalhes deste eletrônico."
    };
  }

  return {
    fallbackName: "produto vintage",
    measureLine: "Adicionar medidas ajuda bastante na conversao.",
    detailLine: "Descreva avarias, tecido, caimento e detalhes de uso para aumentar a confianca.",
    reasons: [
      "Marca preenchida melhora busca e confianca.",
      "Medidas informadas ajudam a destravar decisao.",
      "Estado do item ja esta declarado."
    ],
    photoReview: [
      "Usar uma foto principal sem interface do Instagram.",
      "Centralizar o produto e reduzir elementos do fundo.",
      "Adicionar detalhe de etiqueta, textura e possiveis avarias."
    ],
    instagramTips: [
      "Abrir com uma frase curta e objetiva sobre a peca.",
      "Destacar medidas ou caimento ja nas primeiras linhas.",
      "Fechar com chamada para direct ou link da Enjoei."
    ],
    cta: "Comente ou chame no direct para receber o link da peca."
  };
}

export function buildHeuristicResult(data) {
  const productType = normalizeProductType(data.productType || data.category || data.productName);
  const category = normalizeText(data.category);
  const customName = normalizeText(data.productName);
  const brand = formatBrand(data.brand);
  const color = normalizeText(data.color);
  const size = normalizeText(data.size);
  const condition = normalizeText(data.condition);
  const measures = normalizeText(data.measures);
  const details = normalizeText(data.notes);
  const typeCopy = buildTypeCopy(productType);

  const descriptor = [brand, color, size].filter(Boolean).join(" ").trim();
  const baseName = customName || category || typeCopy.fallbackName;
  const suggestedTitle = [baseName, descriptor].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  const summary = [
    titleCase(baseName),
    brand ? `da marca ${brand}` : "",
    color ? `em ${color}` : ""
  ].filter(Boolean).join(" ");

  const descriptionParts = [
    `${summary}.`.replace(/\s+/g, " ").trim(),
    condition ? `Estado informado: ${condition}.` : "Estado de conservacao a confirmar.",
    measures ? `Informacoes tecnicas e medidas: ${measures}.` : typeCopy.measureLine,
    details ? `Observacoes: ${details}.` : typeCopy.detailLine
  ];

  let hotScore = 2;
  if (brand) hotScore += 1;
  if (measures) hotScore += 1;
  if (condition && /novo|otimo|ótimo|excelente|muito bom/i.test(condition)) hotScore += 1;
  if (productType === "disco" && /edicao|edição|prensagem|primeira prensagem|rar/.test(`${details} ${customName} ${category}`.toLowerCase())) {
    hotScore += 1;
  }
  if (productType === "eletronico" && /funciona|testado|ligando|revisado/.test(`${condition} ${details}`.toLowerCase())) {
    hotScore += 1;
  }
  hotScore = Math.min(5, hotScore);

  const reasons = [
    brand ? typeCopy.reasons[0] : "Marca ausente reduz forca de busca.",
    measures ? typeCopy.reasons[1] : "Sem detalhes objetivos, a conversao tende a cair.",
    condition ? typeCopy.reasons[2] : "Detalhar o estado do item tende a aumentar a confianca."
  ];

  const instagramHook = `${titleCase(baseName)} garimpado para quem gosta de peca com personalidade.`;
  const instagramCaption = [
    `${titleCase(baseName)}${brand ? ` da ${brand}` : ""}${color ? ` em ${color}` : ""}.`,
    condition ? `Estado: ${condition}.` : "Estado sob consulta.",
    measures ? `Detalhes: ${measures}.` : typeCopy.measureLine,
    "Se quiser, chame no direct para reserva ou envio do link na Enjoei."
  ].join(" ");
  const instagramCta = typeCopy.cta;
  const instagramHashtags = [
    "#palmingbrecho",
    "#brecho",
    productType === "roupa" ? "#modavintage" : productType === "disco" ? "#vinil" : "#eletronicosvintage",
    category ? `#${category.toLowerCase().replace(/[^a-z0-9]+/g, "")}` : "#garimpo",
    brand ? `#${brand.toLowerCase().replace(/[^a-z0-9]+/g, "")}` : "#achado"
  ].filter(Boolean);
  const instagramTips = typeCopy.instagramTips;

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
    photoReview: typeCopy.photoReview,
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
- Ajuste a resposta conforme o tipo do item: roupa, disco ou material eletronico.
- Nao invente marca, material ou defeitos se nao forem visiveis ou informados.
- Se a imagem for print do Instagram, considere isso e sugira melhoria de foto.

Dados informados:
- Tipo do item: ${normalizeText(data.productType) || "roupa"}
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

function normalizeModelResult(parsed, data, source) {
  const fallback = buildHeuristicResult(data);

  return {
    suggestedTitle: normalizeText(parsed?.suggestedTitle) || fallback.suggestedTitle,
    alternateTitles: Array.isArray(parsed?.alternateTitles) && parsed.alternateTitles.length
      ? parsed.alternateTitles.slice(0, 3).map((item) => normalizeText(item)).filter(Boolean)
      : fallback.alternateTitles,
    description: normalizeText(parsed?.description) || fallback.description,
    hotScore: Math.max(1, Math.min(5, Number(parsed?.hotScore) || fallback.hotScore)),
    hotLabel: normalizeText(parsed?.hotLabel) || fallback.hotLabel,
    scoreReasons: Array.isArray(parsed?.scoreReasons) && parsed.scoreReasons.length
      ? parsed.scoreReasons.slice(0, 3).map((item) => normalizeText(item)).filter(Boolean)
      : fallback.scoreReasons,
    photoReview: Array.isArray(parsed?.photoReview) && parsed.photoReview.length
      ? parsed.photoReview.slice(0, 3).map((item) => normalizeText(item)).filter(Boolean)
      : fallback.photoReview,
    instagramHook: normalizeText(parsed?.instagramHook) || fallback.instagramHook,
    instagramCaption: normalizeText(parsed?.instagramCaption) || fallback.instagramCaption,
    instagramCta: normalizeText(parsed?.instagramCta) || fallback.instagramCta,
    instagramHashtags: Array.isArray(parsed?.instagramHashtags) && parsed.instagramHashtags.length
      ? parsed.instagramHashtags.slice(0, 5).map((item) => normalizeText(item)).filter(Boolean)
      : fallback.instagramHashtags,
    instagramTips: Array.isArray(parsed?.instagramTips) && parsed.instagramTips.length
      ? parsed.instagramTips.slice(0, 3).map((item) => normalizeText(item)).filter(Boolean)
      : fallback.instagramTips,
    source
  };
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
  return normalizeModelResult(parsed, data, "openai");
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
  return normalizeModelResult(parsed, data, "gemini");
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
