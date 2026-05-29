# Changelog

All notable changes to Style Catalog are documented here.
This project follows a loose semantic-versioning intent (see `PLAN.md` roadmap).

## [0.1.0] — 2026-05-29

### Added — Foundation
- Master plan & vision (`PLAN.md`), README, `AGENTS.md` (AI-agent contract),
  `CONTRIBUTING.md`, MIT license.
- Effect metadata JSON Schema (`schema/effect-meta.schema.json`).
- Zero-dependency build pipeline:
  - `scripts/lib/catalog.mjs` — scan + parse + validate.
  - `scripts/build.mjs` — emits `catalog.json` + `assets/catalog.js`.
  - `scripts/validate.mjs` — CI-friendly validation.
  - `scripts/new-effect.mjs` — effect scaffolder.
  - `scripts/serve.mjs` — tiny static dev server.
- The museum interface (`index.html` + `assets/app.css` + `assets/app.js`):
  search, faceted filters (theme/tech/difficulty/era/tags), live iframe
  miniatures, detail modal (Preview / Source / AI Notes / Details), copy
  button, deep-link hash routing.
- GitHub Actions: CI (validate + build + staleness check) and an optional
  Pages deploy workflow.

### Added — Library (55 effects across 14 themes)
- **Text Effects** (6): neon glow, animated gradient, glitch, typewriter,
  shimmer, line reveal mask.
- **Buttons** (5): ripple, animated gradient border, 3D press, fill sweep,
  glow pulse.
- **Backgrounds** (6): animated gradient, aurora, mesh, grid lines, dot grid,
  floating particles.
- **Hover Interactions** (5): 3D tilt, magnetic, spotlight, lift, image zoom.
- **Loaders & Spinners** (5): ring, bouncing dots, skeleton, indeterminate
  bar, dual ring.
- **Transitions & Animations** (4): scroll reveal, floating bob, shake, blob
  morph.
- **3D Transforms** (3): flip card, rotating cube, layered depth hover.
- **Glass & Neumorphism** (3): glassmorphism, neumorphism, claymorphism.
- **Borders & Shadows** (4): gradient border, glow shadow, long shadow,
  marching ants.
- **Scroll Effects** (3): progress bar, parallax layers, sticky stack.
- **Images & Media** (3): duotone, clip-path shapes, before/after slider.
- **Cursors & Pointers** (2): follow dot/ring, spotlight reveal.
- **Navigation & Menus** (2): animated underline, hamburger morph.
- **Retro Web** (4): CSS marquee, blink, rainbow text, starfield.
