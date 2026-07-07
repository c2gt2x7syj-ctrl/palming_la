import { createClient } from "@supabase/supabase-js";

function normalizeText(value) {
  return String(value || "").trim();
}

function getSupabaseClient() {
  const url = normalizeText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = normalizeText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function buildAnalysisRecord(input, result) {
  return {
    product_type: normalizeText(input.productType) || "roupa",
    product_name: normalizeText(input.productName),
    category: normalizeText(input.category),
    brand: normalizeText(input.brand),
    color: normalizeText(input.color),
    size: normalizeText(input.size),
    item_condition: normalizeText(input.condition),
    measures: normalizeText(input.measures),
    notes: normalizeText(input.notes),
    image_data_url: normalizeText(input.imageDataUrl),
    suggested_title: normalizeText(result.suggestedTitle),
    alternate_titles: Array.isArray(result.alternateTitles) ? result.alternateTitles : [],
    description: normalizeText(result.description),
    hot_score: Number(result.hotScore) || 1,
    hot_label: normalizeText(result.hotLabel),
    score_reasons: Array.isArray(result.scoreReasons) ? result.scoreReasons : [],
    photo_review: Array.isArray(result.photoReview) ? result.photoReview : [],
    instagram_hook: normalizeText(result.instagramHook),
    instagram_caption: normalizeText(result.instagramCaption),
    instagram_cta: normalizeText(result.instagramCta),
    instagram_hashtags: Array.isArray(result.instagramHashtags) ? result.instagramHashtags : [],
    instagram_tips: Array.isArray(result.instagramTips) ? result.instagramTips : [],
    source: normalizeText(result.source),
    warning: normalizeText(result.warning)
  };
}

export async function saveAnalysis(input, result) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      saved: false,
      reason: "supabase_not_configured"
    };
  }

  const payload = buildAnalysisRecord(input, result);
  const { data, error } = await client
    .from("analyses")
    .insert(payload)
    .select("id, created_at")
    .single();

  if (error) {
    if (/relation .*analyses.* does not exist/i.test(error.message)) {
      return {
        saved: false,
        reason: "supabase_table_missing"
      };
    }

    return {
      saved: false,
      reason: `supabase_error:${error.message}`
    };
  }

  return {
    saved: true,
    id: data.id,
    createdAt: data.created_at
  };
}

export async function fetchAnalyses() {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      reason: "supabase_not_configured",
      items: [],
      grouped: []
    };
  }

  const { data, error } = await client
    .from("analyses")
    .select(`
      id,
      created_at,
      product_type,
      product_name,
      category,
      suggested_title,
      hot_score,
      hot_label,
      instagram_caption
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (/relation .*analyses.* does not exist/i.test(error.message)) {
      return {
        ok: false,
        reason: "supabase_table_missing",
        items: [],
        grouped: []
      };
    }

    return {
      ok: false,
      reason: `supabase_error:${error.message}`,
      items: [],
      grouped: []
    };
  }

  const items = Array.isArray(data) ? data : [];
  const groupedMap = new Map();

  items.forEach((item) => {
    const key = normalizeText(item.category) || "Sem categoria";
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key).push(item);
  });

  const grouped = Array.from(groupedMap.entries()).map(([category, records]) => ({
    category,
    count: records.length,
    items: records
  }));

  return {
    ok: true,
    reason: null,
    items,
    grouped
  };
}
