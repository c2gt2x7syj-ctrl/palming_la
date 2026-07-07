import { fetchAnalyses } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payload = await fetchAnalyses();
  res.status(200).json(payload);
}
