import { createClient } from "@supabase/supabase-js";

function normalizeText(value) {
  return String(value || "").trim();
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
