// Tiny dependency-free static file server for local development.
// Usage: node scripts/serve.mjs [port]

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.argv[2]) || 4321;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  try {
    let urlPath;
    try {
      urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch {
      res.writeHead(400).end("Bad Request");
      return;
    }
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const filePath = normalize(join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const info = await stat(filePath).catch(() => null);
    if (!info || info.isDirectory()) {
      res.writeHead(404).end("Not found");
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch (e) {
    // Log server-side; don't leak filesystem paths / stack to the client.
    console.error("serve error:", e.message);
    res.writeHead(500).end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Style Catalog museum running at:\n  → http://localhost:${PORT}/\n`);
});
