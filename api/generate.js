import { generateResult } from "../lib/generate.js";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const result = await generateResult(req.body || {});
  res.status(200).json(result);
}
