// Shared catalog scanner / parser / validator.
// Walks effects/, parses each specimen's embedded metadata, validates it,
// and returns a structured catalog object. Used by build.mjs and validate.mjs.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..", "..");
export const EFFECTS_DIR = join(ROOT, "effects");

const REQUIRED_FIELDS = [
  "id",
  "title",
  "summary",
  "theme",
  "categories",
  "tags",
  "tech",
  "difficulty",
  "ai_usage",
];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const ERAS = ["1990s", "2000s", "2010s", "2020s", "timeless"];
const TECHS = ["css", "js", "html", "svg", "canvas", "webgl"];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const META_RE =
  /<script[^>]*type=["']application\/json["'][^>]*id=["']effect-meta["'][^>]*>([\s\S]*?)<\/script>/i;

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .map((name) => join(dir, name))
    .filter((p) => statSync(p).isDirectory());
}

function listHtml(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".html") && !name.startsWith("_"))
    .map((name) => join(dir, name));
}

function extractTitle(source) {
  const m = source.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}

function validateMeta(meta, ctx, errors) {
  const where = ctx.rel;
  for (const field of REQUIRED_FIELDS) {
    const v = meta[field];
    const empty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);
    if (empty) errors.push(`${where}: missing required field "${field}"`);
  }
  if (meta.id && !SLUG_RE.test(meta.id))
    errors.push(`${where}: id "${meta.id}" is not kebab-case`);
  if (meta.id && meta.id !== ctx.fileSlug)
    errors.push(
      `${where}: id "${meta.id}" does not match file name "${ctx.fileSlug}"`,
    );
  if (meta.theme && meta.theme !== ctx.themeSlug)
    errors.push(
      `${where}: theme "${meta.theme}" does not match folder "${ctx.themeSlug}"`,
    );
  if (meta.difficulty && !DIFFICULTIES.includes(meta.difficulty))
    errors.push(`${where}: difficulty "${meta.difficulty}" is invalid`);
  if (meta.era && !ERAS.includes(meta.era))
    errors.push(`${where}: era "${meta.era}" is invalid`);
  if (Array.isArray(meta.tech)) {
    for (const t of meta.tech)
      if (!TECHS.includes(t))
        errors.push(`${where}: tech "${t}" is not one of ${TECHS.join(", ")}`);
  }
}

// Scan the library. Returns { catalog, errors }.
export function scanCatalog() {
  const errors = [];
  const themes = [];
  const effects = [];
  const seenIds = new Map();

  for (const themeDir of listDirs(EFFECTS_DIR).sort()) {
    const themeSlug = basename(themeDir);
    if (!SLUG_RE.test(themeSlug)) {
      errors.push(`theme folder "${themeSlug}" is not kebab-case`);
    }
    const themeMetaPath = join(themeDir, "_theme.json");
    let themeMeta = { title: themeSlug, description: "", order: 999 };
    if (existsSync(themeMetaPath)) {
      try {
        themeMeta = { ...themeMeta, ...JSON.parse(readFileSync(themeMetaPath, "utf8")) };
      } catch (e) {
        errors.push(`${relative(ROOT, themeMetaPath)}: invalid JSON (${e.message})`);
      }
    } else {
      errors.push(`effects/${themeSlug}: missing _theme.json`);
    }

    let themeCount = 0;
    for (const file of listHtml(themeDir).sort()) {
      const rel = relative(ROOT, file).split("\\").join("/");
      const fileSlug = basename(file, ".html");
      const source = readFileSync(file, "utf8");
      const m = source.match(META_RE);
      if (!m) {
        errors.push(`${rel}: no <script id="effect-meta"> block found`);
        continue;
      }
      let meta;
      try {
        meta = JSON.parse(m[1]);
      } catch (e) {
        errors.push(`${rel}: effect-meta is invalid JSON (${e.message})`);
        continue;
      }
      validateMeta(meta, { rel, fileSlug, themeSlug }, errors);

      if (meta.id) {
        if (seenIds.has(meta.id))
          errors.push(`${rel}: duplicate id "${meta.id}" (also in ${seenIds.get(meta.id)})`);
        else seenIds.set(meta.id, rel);
      }

      effects.push({
        id: meta.id || fileSlug,
        title: meta.title || extractTitle(source) || fileSlug,
        summary: meta.summary || "",
        description: meta.description || "",
        theme: themeSlug,
        themeTitle: themeMeta.title,
        categories: meta.categories || [],
        tags: meta.tags || [],
        tech: meta.tech || [],
        era: meta.era || "timeless",
        difficulty: meta.difficulty || "beginner",
        dependencies: meta.dependencies || [],
        browser_support: meta.browser_support || "",
        performance_notes: meta.performance_notes || "",
        accessibility_notes: meta.accessibility_notes || "",
        customization: meta.customization || [],
        variations: meta.variations || [],
        related: meta.related || [],
        ai_usage: meta.ai_usage || "",
        path: rel,
        source,
      });
      themeCount += 1;
    }

    themes.push({
      slug: themeSlug,
      title: themeMeta.title,
      description: themeMeta.description || "",
      icon: themeMeta.icon || "",
      order: themeMeta.order ?? 999,
      count: themeCount,
    });
  }

  themes.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  effects.sort((a, b) => a.theme.localeCompare(b.theme) || a.title.localeCompare(b.title));

  // Build facets for the gallery filters.
  const facets = {
    themes: themes.map((t) => ({ slug: t.slug, title: t.title, count: t.count })),
    tech: tally(effects.flatMap((e) => e.tech)),
    difficulty: tally(effects.map((e) => e.difficulty)),
    era: tally(effects.map((e) => e.era)),
    categories: tally(effects.flatMap((e) => e.categories)),
    tags: tally(effects.flatMap((e) => e.tags)),
  };

  const catalog = {
    name: "style-catalog",
    version: "0.15.0",
    // NOTE: intentionally no build timestamp here — the generated artifacts
    // (catalog.json / assets/catalog.js) are committed and verified for
    // staleness in CI, so the output must be deterministic from the inputs.
    counts: { themes: themes.length, effects: effects.length },
    themes,
    facets,
    effects,
  };

  return { catalog, errors };
}

function tally(arr) {
  const map = new Map();
  for (const v of arr) map.set(v, (map.get(v) || 0) + 1);
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
}
