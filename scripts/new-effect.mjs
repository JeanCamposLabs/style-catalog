// Scaffold a new effect specimen from a template.
// Usage: node scripts/new-effect.mjs <theme-slug> <effect-slug> "Title"
//
// Creates effects/<theme-slug>/<effect-slug>.html with a filled-in metadata
// block ready to edit. Refuses to overwrite an existing file.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [themeSlug, effectSlug, ...titleParts] = process.argv.slice(2);

if (!themeSlug || !effectSlug) {
  console.error('Usage: node scripts/new-effect.mjs <theme-slug> <effect-slug> "Title"');
  process.exit(1);
}
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
if (!SLUG_RE.test(themeSlug) || !SLUG_RE.test(effectSlug)) {
  console.error("Slugs must be kebab-case (a-z, 0-9, hyphens).");
  process.exit(1);
}
const title =
  titleParts.join(" ") ||
  effectSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const themeDir = join(ROOT, "effects", themeSlug);
const themeMetaPath = join(themeDir, "_theme.json");
const filePath = join(themeDir, `${effectSlug}.html`);

if (existsSync(filePath)) {
  console.error(`Refusing to overwrite existing file: ${filePath}`);
  process.exit(1);
}
mkdirSync(themeDir, { recursive: true });

if (!existsSync(themeMetaPath)) {
  writeFileSync(
    themeMetaPath,
    JSON.stringify(
      {
        title: themeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "TODO: describe this theme.",
        order: 999,
        icon: "✨",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Created theme metadata: effects/${themeSlug}/_theme.json`);
}

const meta = {
  id: effectSlug,
  title,
  summary: "TODO one-line summary.",
  description: "TODO longer description.",
  theme: themeSlug,
  categories: ["TODO"],
  tags: ["TODO"],
  tech: ["css"],
  era: "2020s",
  difficulty: "beginner",
  dependencies: [],
  browser_support: "TODO",
  performance_notes: "TODO",
  accessibility_notes: "TODO",
  customization: [{ name: "--example", description: "TODO", default: "value" }],
  variations: ["TODO"],
  related: [],
  ai_usage: "TODO: tell another AI agent when and how to use this effect.",
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script type="application/json" id="effect-meta">
${JSON.stringify(meta, null, 2)}
  </script>
  <style>
    /* TODO: the effect's CSS */
    html, body { height: 100%; margin: 0; display: grid; place-items: center;
      background: #111; color: #eee; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <!-- TODO: markup demonstrating the effect -->
  <div>${title}</div>
</body>
</html>
`;

writeFileSync(filePath, html);
console.log(`✓ Created effects/${themeSlug}/${effectSlug}.html`);
console.log("  Edit it, then run: npm run build");
