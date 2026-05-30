# Glossary & Taxonomy

A reference for the vocabulary used across the catalog — for humans browsing
and for AI agents querying `catalog.json` / the MCP server. The catalog's facet
values (`catalog.facets`) are the source of truth for what currently exists;
this document explains what the terms *mean* and how to use them.

## Metadata dimensions

### `theme`
The top-level grouping (one folder under `effects/`). Themes mix UI-effect
families (e.g. `buttons`, `backgrounds`) with broader **design-choice domains**
(e.g. `color-systems`, `layout-archetypes`) — the catalog is a museum of design
decisions, not only animations.

### `tech`
What the specimen relies on. One or more of:

| Value | Meaning |
|---|---|
| `css` | Styling/animation in CSS only |
| `js` | Requires JavaScript |
| `html` | Notable semantic HTML structure |
| `svg` | Uses inline SVG |
| `canvas` | Draws on `<canvas>` |
| `webgl` | GPU/WebGL (none yet — reserved) |

Prefer the lowest-tech option that achieves the effect; `dependencies` should
be empty (everything in the catalog is vanilla).

### `difficulty`
Implementation/maintenance complexity, **not** visual impressiveness.

- `beginner` — a few well-known properties; safe to copy as-is.
- `intermediate` — multiple moving parts or a small JS handler.
- `advanced` — 3D math, many layers, or careful perf/accessibility handling.

### `era`
When the technique became idiomatic on the web (cultural placement, not the
only time it's valid):

- `1990s` / `2000s` — retro web (marquee, blink, starfield…).
- `2010s` — flat design, Material, long-shadow, glitch.
- `2020s` — glassmorphism, aurora/mesh, scroll-driven animation, bento.
- `timeless` — fundamentals that never went out of style (card lift, type
  scale, holy-grail layout).

## Field reference (per effect)

See [`AGENTS.md`](../AGENTS.md) for the full schema. The two fields agents rely
on most:

- **`source`** — the complete, runnable HTML of the specimen (what you copy).
- **`ai_usage`** — natural-language integration guidance written for a
  consuming agent: when to reach for it, which knobs to turn, and pitfalls.

## Key tag/concept glossary

Tags are free-form search keywords; these are the recurring concepts worth
knowing:

| Term | What it refers to |
|---|---|
| **backdrop-filter** | Blurs/affects what's *behind* an element — the basis of glassmorphism. Needs `-webkit-` in Safari; provide a solid fallback. |
| **background-clip: text** | Paints a background (gradient/animation) and clips it to glyph shapes — gradient/shimmer/rainbow text. |
| **clip-path** | Crops an element to a shape (polygon/inset/circle); animatable when point counts match. Used for shape framing and reveals. |
| **scroll-snap** | Native CSS that locks scrolling to slide boundaries — JS-free carousels/section snapping. |
| **scroll-driven animation** | `animation-timeline: scroll()/view()` — ties animation progress to scroll position, off the main thread. |
| **IntersectionObserver** | The efficient JS API for "do X when this enters the viewport" — scroll reveals without scroll listeners. |
| **preserve-3d / perspective** | Establish a 3D space so children can sit at different `translateZ` depths — flips, cubes, depth tilt. |
| **prefers-reduced-motion** | A user setting; every animated specimen guards motion behind it. Honor it always. |
| **design tokens** | Named, reusable values (colors, type sizes, durations) as CSS custom properties. Two-tier = primitives → semantic roles. |
| **semantic tokens** | Intent-named variables (`--color-primary`) that map to primitives; components reference these so themes swap cleanly. |
| **measure** | The line length of body text (ideal ~60–75 characters / `ch`). |
| **modular scale** | A type-size sequence generated from a single ratio (e.g. 1.25). |
| **easing** | The acceleration curve of motion (`cubic-bezier`). ease-out for entrances, linear only for continuous motion. |
| **stagger** | Offsetting sibling animations by a per-index delay so they cascade. |
| **lerp** | Linear interpolation (`current += (target - current) * ease`) — the trick behind trailing cursors/tilt smoothing. |
| **mix-blend-mode** | Blends an element with what's beneath it — duotone, glow, difference cursors. |

## How agents should use this

1. Call `list_themes` / read `api/themes.json` to learn the taxonomy and
   facets that actually exist right now.
2. Filter with `search_effects` (or read `api/index.json`) using the
   dimensions above.
3. Pull the full record with `get_effect` (or `api/effects/<id>.json`) and read
   `ai_usage` before integrating `source`.
