import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { generateResult } from "./lib/generate.js";
import { saveAnalysis } from "./lib/supabase.js";

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
          const result = await generateResult(data);
          const persistence = await saveAnalysis(data, result).catch((error) => ({
            saved: false,
            reason: error.message
          }));
          result.persistence = persistence;
          sendJson(res, 200, result);
        } catch {
          sendJson(res, 500, {
            error: "Não foi possível gerar a análise."
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
