# Style Catalog — Master Plan & Vision

> A museum **and** a catalogue of web design effects across the history of the
> internet. Built by an AI agent, for AI agents (and the humans who direct
> them). Every effect is a self-contained, runnable, copy-pasteable specimen
> with machine-readable metadata and explicit "how to use me" instructions.

---

## 1. Why this exists

When building projects, choosing and re-implementing visual effects (glows,
gradients, glassmorphism, scroll reveals, retro marquees, 3D card flips, …)
eats enormous time. Libraries exist, but they are written human-to-human and
scattered. This project is different:

- **AI-first.** Each effect carries structured metadata and an `ai_usage`
  field written specifically so another AI agent can drop it into a project
  correctly, knowing what to tweak and what to watch out for.
- **A living museum.** A browsable gallery shows *working* miniatures of every
  effect, searchable by theme, tag, tech, era, and difficulty.
- **A catalogue.** A single canonical `catalog.json` is the programmatic index
  of the entire collection — the API surface for agents and tools.
- **Timeless + extensible.** Today: HTML/CSS/JS effects. Tomorrow: any design
  choice (motion systems, color theory, layout archetypes, sound, 3D, shader
  snippets). The data model is built so new domains slot in without rework.

## 2. Design principles

1. **One file = one complete specimen.** Every effect is a single,
   self-contained, directly-runnable `.html` file. No build step required to
   *view* an individual effect. Open it, it works.
2. **Metadata travels with the artifact.** Each effect embeds a JSON metadata
   block (`<script type="application/json" id="effect-meta">`). The artifact is
   simultaneously a working demo and a structured record.
3. **The library is the source of truth.** `catalog.json` and the gallery are
   *generated*. Humans/agents add effects by adding files; tooling does the
   rest.
4. **Zero runtime dependencies.** The gallery is vanilla HTML/CSS/JS and runs
   from `file://` or any static host. No framework, no server required.
5. **Machine-digestible first, pretty second.** Predictable structure, stable
   IDs, explicit fields. The museum aesthetic rides on top of clean data.
6. **Accessible & honest.** Each specimen documents browser support,
   performance cost, and accessibility considerations (e.g.
   `prefers-reduced-motion`).

## 3. Architecture

```
style-catalog/
├── PLAN.md                     # this document
├── README.md                   # quick start (humans)
├── AGENTS.md                   # how AI agents should consume the catalog
├── CONTRIBUTING.md             # how to add an effect (humans + agents)
├── LICENSE                     # MIT
├── package.json                # build/validate/serve scripts, no deps
├── index.html                  # the museum interface (gallery app shell)
├── assets/
│   ├── app.css                 # gallery styling (committed, stable)
│   ├── app.js                  # gallery logic, vanilla, file://-safe
│   └── catalog.js              # GENERATED: window.__CATALOG__ = {...}
├── catalog.json                # GENERATED: canonical machine-readable index
├── schema/
│   └── effect-meta.schema.json # JSON Schema for an effect's metadata block
├── scripts/
│   ├── lib/catalog.mjs         # shared scan + parse + validate
│   ├── build.mjs               # scans effects/ -> catalog.json + catalog.js
│   ├── validate.mjs            # CI-friendly validation (no writes)
│   ├── serve.mjs               # tiny static dev server (no deps)
│   └── new-effect.mjs          # scaffolder: create a new effect from template
└── effects/
    └── <theme-slug>/
        ├── _theme.json         # theme title, description, order, icon
        └── <effect-slug>.html  # a complete, runnable specimen
```

### Effect file anatomy

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Neon Glow Text</title>
  <script type="application/json" id="effect-meta">
  { "id": "...", "title": "...", "ai_usage": "...", ... }
  </script>
  <style>/* the effect's CSS */</style>
</head>
<body>
  <!-- the markup that demonstrates the effect -->
  <script>/* optional JS */</script>
</body>
</html>
```

- The browser ignores the JSON `<script>` (wrong type), so the file renders as
  a pure demo.
- The build reads the JSON block for metadata and stores the **entire file
  text** as the copyable `source`.
- The gallery shows the file in an `<iframe loading="lazy">` as the live
  miniature, and the source in a "Source" tab with a copy button.

### Generated outputs

- `catalog.json` — pretty-printed canonical index (themes + effects + facets).
- `assets/catalog.js` — same data assigned to `window.__CATALOG__` so the
  gallery works from `file://` without `fetch()` (which browsers block on
  `file://`).

Both are committed so a fresh clone (or a downloaded zip) works with no build.

## 4. Metadata model (per effect)

| Field | Type | Required | Purpose |
|---|---|---|---|
| `id` | string (slug) | ✓ | Stable unique identifier |
| `title` | string | ✓ | Human-readable name |
| `summary` | string | ✓ | One-line description |
| `description` | string | – | Longer prose |
| `theme` | slug | ✓ | Must match the parent folder |
| `categories` | string[] | ✓ | Broad groupings |
| `tags` | string[] | ✓ | Free-form search keywords |
| `tech` | string[] | ✓ | e.g. `css`, `js`, `svg`, `canvas` |
| `era` | string | – | e.g. `1990s`, `2000s`, `2010s`, `2020s`, `timeless` |
| `difficulty` | enum | ✓ | `beginner` \| `intermediate` \| `advanced` |
| `dependencies` | string[] | – | External libs (ideally empty) |
| `browser_support` | string | – | Compatibility notes |
| `performance_notes` | string | – | Cost / GPU / repaint notes |
| `accessibility_notes` | string | – | `prefers-reduced-motion`, contrast, etc. |
| `customization` | {name,description}[] | – | The knobs to turn (CSS vars, params) |
| `variations` | string[] | – | Ideas for adapting it |
| `related` | id[] | – | Sibling effects |
| `ai_usage` | string | ✓ | **Instructions to another AI agent**: when to use it, how to integrate, what to change, pitfalls |

## 5. Theme taxonomy (initial)

Themes are folders; new themes are just new folders with a `_theme.json`.

1. `text-effects` — typography: neon, gradient, glitch, typewriter, shimmer…
2. `buttons` — hover states, ripples, gradient borders, 3D press…
3. `backgrounds` — animated gradients, aurora, mesh, noise, patterns…
4. `hover-interactions` — cards, image reveals, magnetic, tilt…
5. `loaders-spinners` — spinners, skeletons, progress, dots…
6. `transitions-animations` — keyframes, reveals, attention seekers…
7. `3d-transforms` — flips, cubes, perspective, parallax layers…
8. `glass-neumorphism` — glassmorphism, neumorphism, frosted surfaces…
9. `scroll-effects` — scroll-driven animation, sticky, parallax…
10. `borders-shadows` — gradient/animated borders, layered shadows…
11. `images-media` — filters, duotone, clip-path, masks…
12. `cursors-pointers` — custom cursors, trailing, spotlight…
13. `navigation-menus` — underlines, hamburgers, mega menus…
14. `retro-web` — marquee, blink, starfield, visitor counter, 88x31…

> The catalog is intentionally open-ended. The long-term vision adds
> non-HTML/CSS domains (motion design tokens, palettes, layout archetypes,
> shaders, sound design) as new top-level themes using the same metadata model.

## 6. The museum interface

A single-page, dependency-free gallery (`index.html`):

- **Search** across title, summary, description, tags, categories.
- **Facet filters** (multi-select chips): theme, tech, difficulty, era, tags.
- **Live miniatures**: lazy-loaded sandboxed iframes of each specimen.
- **Detail view** (modal): large live preview + tabs for *Preview / Source /
  AI Notes / Details*, with a one-click **Copy source** button.
- **Deep links**: URL hash syncs the open effect (`#effect=<id>`) and search.
- **Museum aesthetic**: dark, gallery-like, responsive grid.

## 7. Enterprise-readiness

- **MIT licensed**, documented, contributor guide.
- **Validation**: `npm run validate` enforces schema, unique IDs, theme/folder
  agreement — wired into CI.
- **CI**: GitHub Actions builds + validates on every push/PR; an optional Pages
  deploy workflow is included (enable when you pick a host).
- **No secrets, no runtime deps, fully static** → trivially stageable for other
  teams.
- **Stable contract**: `catalog.json` + the metadata schema are the public API.

## 8. Roadmap

- **v0: Foundation + deep seed.** ✅ Build system, schema, gallery, scaffolder,
  CI, docs, and a 55-effect library across 14 themes.
- **v1: Breadth.** ✅ Grew themes; added combination "recipes"
  (`combos-recipes`) and a tag/taxonomy glossary (`docs/GLOSSARY.md`).
- **v2: Beyond HTML/CSS.** ✅ (in progress) New design-choice domains:
  `color-systems`, `typography-systems`, `layout-archetypes`,
  `motion-principles`. _Still to come: SVG/canvas/shader snippets, sound._
- **v3: Programmatic access.** ✅ (initial) Split fetchable API (`api/index.json`,
  `api/effects/<id>.json`, `api/themes.json`) + a zero-dependency **MCP server**
  (`mcp/server.mjs`). _Still to come: npm package publish._
- **v4: Community.** Submission flow, screenshots/thumbnails generation,
  versioned releases.

> Status as of v0.3.0: **94 effects across 20 themes**, plus the API + MCP
> access layer.

## 9. How work proceeds (for the agent following this plan)

1. Lay down config, docs, schema, and build tooling.
2. Build the gallery app shell (`index.html`, `app.css`, `app.js`).
3. Author effects theme-by-theme as self-contained files.
4. Run `npm run build` to regenerate `catalog.json` + `catalog.js`.
5. Run `npm run validate`; fix any errors.
6. Commit in logical chunks; push; open a draft PR.
7. Keep extending — the structure makes every addition incremental.
