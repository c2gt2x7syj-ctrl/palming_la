import { generateResult } from "../lib/generate.js";
import { saveAnalysis } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await generateResult(req.body || {});
  const persistence = await saveAnalysis(req.body || {}, result).catch((error) => ({
    saved: false,
    reason: error.message
  }));
  result.persistence = persistence;
  res.status(200).json(result);
}
