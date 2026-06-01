# 🖼️ Style Catalog

**A museum and catalogue of web design effects across the history of the
internet — built by an AI agent, for AI agents (and the humans who direct
them).**

Every effect is a single, self-contained, directly-runnable HTML file with
machine-readable metadata and an explicit `ai_usage` field that tells another
AI agent exactly how to drop it into a project. A zero-dependency gallery lets
you browse, search, and preview every specimen live.

> See [`PLAN.md`](PLAN.md) for the full vision and roadmap.

---

## Quick start

```bash
# 1. Build the catalog index (regenerates catalog.json + assets/catalog.js)
npm run build

# 2. Open the museum
npm run serve          # → http://localhost:4321
# …or just open index.html directly in a browser (works from file://).
```

No dependencies to install — everything runs on plain Node.js (>=18) and the
browser.

## What's in the box

| Path | What it is |
|---|---|
| `index.html` + `assets/` | The museum: searchable, filterable gallery with live previews |
| `effects/<theme>/*.html` | The collection — one self-contained specimen per file |
| `catalog.json` | **Generated** canonical machine-readable index (the public API) |
| `assets/catalog.js` | **Generated** `window.__CATALOG__` for the `file://`-safe gallery |
| `assets/posters/` | **Generated** static card thumbnails (`npm run posters`) |
| `schema/effect-meta.schema.json` | JSON Schema for an effect's metadata |
| `scripts/` | Build, validate, scaffold, serve, and poster tooling (no runtime deps) |
| `CLAUDE.md` | Orientation for agents working *on* the repo |

## Using an effect in your project

1. Browse the gallery, find an effect, open it.
2. Read its **AI Notes** (when/how to use) and **Details** (knobs, support,
   plus clickable **Related** effects).
3. Hit **Copy source** for the raw HTML, or **📋 Copy for AI** for a paste-ready
   prompt (summary + how-to-apply + tuned source) to hand to an agent.
4. Lift the `<style>`, markup, and any `<script>` into your project and tweak
   the documented customization variables.

> Tip: select several effects into the **bundle** to copy one combined,
> agent-ready document covering all of them at once.

Or, programmatically: read `catalog.json` and pull the `source` and `ai_usage`
fields for any effect `id`.

## Adding an effect

```bash
npm run new -- <theme-slug> <effect-slug> "My Effect Title"
# edit effects/<theme-slug>/<effect-slug>.html
npm run build        # regenerate the index
npm run validate     # confirm it passes
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full authoring guide,
[`AGENTS.md`](AGENTS.md) for the AI-agent *consumer* contract, and
[`CLAUDE.md`](CLAUDE.md) for orientation when *developing* the project itself
(repo map, gallery architecture, release ritual).

## Scripts

| Command | Action |
|---|---|
| `npm run build` | Scan `effects/`, validate, emit `catalog.json`, `assets/catalog.js`, and the `api/` tree |
| `npm run validate` | Validate the library (CI-friendly, no writes) |
| `npm run new` | Scaffold a new effect file |
| `npm run serve` | Serve the museum locally |
| `npm run posters` | Regenerate gallery poster thumbnails (needs dev-only Playwright) |
| `npm run mcp` | Start the MCP server (query the catalog over stdio) |
| `npm run dev` | Build, then serve |

## Programmatic access (for agents & tools)

- **`catalog.json`** — full machine-readable index (every effect incl. `source`).
- **`api/index.json`** — lightweight summaries for discovery (no `source`).
- **`api/effects/<id>.json`** — one effect's full record; **`api/themes.json`** — taxonomy + facets.
- **MCP server** (`npm run mcp`) — zero-dependency stdio server exposing
  `list_themes`, `search_effects`, and `get_effect`. See [`mcp/README.md`](mcp/README.md).
- Taxonomy & key terms: [`docs/GLOSSARY.md`](docs/GLOSSARY.md).

## License

MIT — see [`LICENSE`](LICENSE).
