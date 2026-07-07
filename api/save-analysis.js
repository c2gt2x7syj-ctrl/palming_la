import { saveAnalysis } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const input = req.body?.input || {};
  const result = req.body?.result || {};
  const persistence = await saveAnalysis(input, result).catch((error) => ({
    saved: false,
    reason: error.message
  }));

  res.status(200).json(persistence);
}
