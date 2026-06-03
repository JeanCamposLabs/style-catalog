// Generate static poster thumbnails for every effect, used as the resting
// image for each gallery card (the live iframe mounts only on hover/focus).
//
// Posters are committed to assets/posters/<id>.jpg so the deploy stays simple
// and dependency-free. Regenerate after adding or changing effects:
//
//   npm i -D playwright && npx playwright install chromium
//   npm run posters
//
// Effects without a poster degrade gracefully — the gallery falls back to the
// frozen live iframe for that card.

import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = join(ROOT, "assets", "posters");
const W = 640, H = 400, SETTLE_MS = 1300, CONCURRENCY = 4;

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2",
};

function staticServer(root) {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      try {
        let p = decodeURIComponent(req.url.split("?")[0]);
        if (p.endsWith("/")) p += "index.html";
        const file = join(root, p);
        if (!file.startsWith(root) || !existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
        res.setHeader("content-type", MIME[extname(file)] || "application/octet-stream");
        res.end(readFileSync(file));
      } catch { res.statusCode = 500; res.end("err"); }
    });
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

const catalog = JSON.parse(readFileSync(join(ROOT, "catalog.json"), "utf8"));
const effects = catalog.effects;
mkdirSync(OUT, { recursive: true });

const srv = await staticServer(ROOT);
const port = srv.address().port;
let browser;
try {
  browser = await chromium.launch({ args: ["--no-sandbox"] });
} catch (err) {
  srv.close();
  console.error(
    "\n✗ Could not launch Chromium. Install the dev dependency first:\n" +
      "    npm i -D playwright && npx playwright install chromium\n\n" +
      String(err).split("\n")[0],
  );
  process.exit(1);
}

let done = 0, failed = [];
async function shoot(e) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  try {
    await page.goto(`http://127.0.0.1:${port}/${e.path}`, { waitUntil: "load", timeout: 15000 });
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: join(OUT, `${e.id}.jpg`), type: "jpeg", quality: 80 });
  } catch (err) {
    failed.push(`${e.id}: ${String(err).split("\n")[0]}`);
  } finally {
    await ctx.close();
    process.stdout.write(`\r  ${++done}/${effects.length}  ${e.id.slice(0, 40).padEnd(40)}`);
  }
}

// simple concurrency pool
const queue = effects.slice();
try {
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await shoot(queue.shift());
  }));
} finally {
  await browser.close();
  srv.close();
}
console.log(`\n✓ Generated ${done - failed.length}/${effects.length} posters into assets/posters/`);
if (failed.length) { console.log(`⚠ ${failed.length} failed:`); failed.forEach((f) => console.log("  " + f)); }
