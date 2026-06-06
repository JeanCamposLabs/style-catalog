# Changelog

All notable changes to Style Catalog are documented here.
This project follows a loose semantic-versioning intent (see `PLAN.md` roadmap).

## [0.22.0] — 2026-06-06

### Added — more rotating 3D solids
- Three new pure-CSS specimens in **3D Transforms**, companions to the cube:
  **Rotating 3D Pyramid** (`pyramid-rotate`), **Rotating Tetrahedron**
  (`tetrahedron-rotate`), and **Rotating Octahedron** (`octahedron-rotate`).
- Each folds clip-path triangles up to a shared apex inside a `preserve-3d`
  scene and spins on a loop; geometry uses precomputed ratio constants (no CSS
  trig), so a single `--s` scales the whole solid. All pause to a static pose
  under `prefers-reduced-motion`. The cube now cross-links to all three.

## [0.21.0] — 2026-06-01 — Enterprise-readiness pass

A deep audit (frontend, tooling, MCP/data, repo/CI) followed by fixes and
hardening. No user-facing behaviour changes beyond the accessibility win.

### Fixed
- **Data integrity:** removed **35 dangling `related` references** across 22
  effects (they pointed at ids that don't exist). The build now **validates**
  that every `related` id resolves — dead links can no longer ship.
- **Validation parity with the schema:** unknown metadata fields are rejected
  (typo guard), `customization` entries are checked for `name`/`description`,
  alongside the existing enum/uniqueness/agreement checks.
- **Accessibility:** Tab/Shift+Tab focus is now **trapped** inside open dialogs
  (modal, cart, filters).
- **Dev server:** no longer leaks filesystem paths in errors; returns `400` on
  malformed URLs instead of a `500`.
- **Poster script:** fails with a clear message (and cleans up) if Chromium
  isn't installed.
- **MCP `search_effects`:** `limit` is clamped to `1..100` (a negative value
  previously returned the wrong rows; an unbounded one could dump the catalog).
- **Spaceship cursor hotspot:** the click point is now the ship's **nose tip**
  (it banks around the nose so it stays under the pointer), instead of the
  ship's middle — matching a normal cursor's clickable tip.

### Added
- **Test suite** (`npm test`, Node's built-in runner, zero deps): catalog
  validator unit tests + MCP server protocol/tool integration tests.
- **CI quality gate:** install-free `lint` (syntax check) + `test` jobs, plus
  least-privilege `permissions`.
- **Repo hygiene:** `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`,
  Dependabot, issue/PR templates, `.editorconfig`.
- **[`ROADMAP.md`](ROADMAP.md):** the growth + hardening plan.

### Changed
- **Single source of truth for the version:** `scripts/lib/catalog.mjs` now
  reads `version` from `package.json` (no more two-place bumping).


## [0.20.14] — 2026-06-01

### Docs
- Added **`CLAUDE.md`** — orientation for an agent developing the repo: repo
  map (what's hand-edited vs generated), the build pipeline, a tour of
  `assets/app.js` by section, the dev workflow, the release/deploy ritual
  (incl. the `major.minor.<commit-count>` version model), and conventions.
- Refreshed `README.md` for today's features: the **Copy for AI** button,
  **Related** effects, the **bundle** export, the `npm run posters` script, and
  the `assets/posters/` + `CLAUDE.md` entries in the layout table.

## [0.20.13] — 2026-06-01

### Fixed
- **Spaceship cursor frame-rate.** Removed every CSS `filter: drop-shadow` from
  the ship and its flame — a drop-shadow on an element that rotates and rescales
  each frame forces the browser to re-rasterize that glowing layer every frame,
  which capped the frame rate and made the motion look stepped/choppy even on
  fast machines. The glow is now baked into the SVG as a radial gradient
  (rasterized once, transformed on the GPU for free), and the exhaust-trail
  canvas renders at 1× density instead of 2× (a full-screen retina layer cleared
  and composited every frame was the other big cost). The cursor now flows at
  full refresh rate.

## [0.20.12] — 2026-06-01

### Changed
- **Spaceship cursor — much smoother.** Switched the follow/banking to
  frame-rate-independent (time-constant) easing so it feels identical and fluid
  at 60 / 120 / 144 Hz, and tightened the follow so the ship sits right on the
  pointer instead of trailing behind. Stopped reading the brand accents via
  `getComputedStyle` every frame (it forced a style recalc each tick — the main
  source of micro-stutter); the colors are cached and refreshed periodically.
  The ship now renders on its own GPU layer (`translate3d`), and the exhaust
  trail fades at a consistent wall-clock rate regardless of refresh rate.

## [0.20.11] — 2026-06-01

### Added
- **Spaceship cursor** — on the museum chrome the pointer becomes a little ship
  that glides toward the real cursor with a touch of lag, banks its nose toward
  the direction of travel, fires a brighter thruster the faster you move, and
  leaves a fading exhaust trail on a full-screen canvas. The hull picks up the
  live brand accent colors, and it flashes a boost glow over interactive
  targets. Fine-pointer + motion only — touch devices and `prefers-reduced-motion`
  keep the native cursor, and the text caret is preserved inside inputs.

## [0.20.10] — 2026-06-01

### Added — poster thumbnails
- Each gallery card now rests on a static poster image (`assets/posters/<id>.jpg`,
  generated by the new `npm run posters` script) instead of a live iframe. The
  live iframe mounts only on hover/focus and animates just that one card. This
  drops the number of simultaneously-mounted iframes from ~10+ to ~1, cutting
  memory and compositing load, speeding initial load, and giving every card a
  deliberate, representative frame.
- Effects without a poster degrade gracefully — the card falls back to the
  frozen live iframe.
- New `scripts/posters.mjs` (Playwright, dev-only) screenshots all 172 effects;
  `npm run posters` regenerates them. The runtime gallery remains dependency-free.

## [0.20.9] — 2026-06-01

### Added
- **Related effects** — the modal's Details tab now lists each effect's related
  specimens as clickable chips that jump straight to them (stale ids that no
  longer exist are filtered out).
- **Copy for AI** — a button on the AI Notes tab copies a single, paste-ready
  prompt for that effect: summary, how-to-apply, tech/deps, customizable tokens,
  and the (tuned) source in a fenced block.
- **Social cards** — Open Graph / Twitter meta tags plus a generated 1200×630
  cover image (`assets/og-cover.png`) so the museum link unfurls nicely when
  shared.

## [0.20.8] — 2026-06-01

### Added — curated hero row
- A hand-picked set of six effects is now pinned to the very front of the
  "Featured" sort, chosen for variety so the opening shows range: 3D Coverflow
  Carousel, Spatial Depth (parallax), Floating Particles, Gooey Blob Trail
  Cursor, SVG Morphing Blob Loader, Tilt + Spotlight Card. The score-ranked
  effects follow. Pins only reorder within the active filter — they don't
  force-show items the visitor has filtered out.

## [0.20.7] — 2026-06-01

### Added — "Featured" sort, now the default
- The grid opens with the showiest, most kinetic effects first — 3D carousels,
  parallax, particles, cursor/spotlight, morphs — to hook a first-time visitor,
  while static reference pages (tokens, type scales, form fields) sink to the
  bottom. Score is a weighted sum over each effect's tags, categories, and tech.
- "Featured" is the new first option in the sort dropdown and the default; the
  previous theme/A–Z/difficulty/era sorts remain.

## [0.20.6] — 2026-06-01

### Added — hover-to-play previews
- The grid is alive again without the flicker: previews stay frozen at rest, and
  the card you **hover or focus** plays its animation live. Only one preview
  animates at a time — far below the count that overwhelmed Chrome's compositor.
- The rAF freeze is now reversible (pending callbacks are held and replayed on
  resume) so animations can pause/resume cleanly instead of being killed.
- Respects `prefers-reduced-motion`: those users keep the static frame on hover.

## [0.20.5] — 2026-06-01

### Fixed — the blinking glitch, for real this time
- Diagnosis (via incognito + empty-grid + cross-browser tests): the flicker was
  Chrome's compositor struggling with **~10+ effect iframes all animating at
  once** — not the chrome around them. Empty grid = no flicker; previews on =
  flicker; only in that Chrome/GPU.
- **Grid previews are now frozen to a static frame** — on load, each preview
  iframe gets its CSS animations paused and its `requestAnimationFrame` loop
  stopped. No continuous compositing, no flicker. The **full animation still
  plays in the modal** when you open a card.

## [0.20.4] — 2026-06-01

### Fixed
- **The blinking band that followed the mouse — root cause found.** It was a
  GPU compositing artifact from `backdrop-filter: blur()` on elements layered
  over the animating effect iframes — chiefly the **sticky toolbar** (a
  full-width frosted bar over the moving grid) and the **fixed version badge**.
  Chrome fails to invalidate the backdrop region, leaving a stale color band
  (teal/purple) that flickers and tracks repaints. Removed `backdrop-filter`
  everywhere (toolbar, version badge, modal backdrop, palette lock) and bumped
  the backgrounds to near-opaque so the look is unchanged.

## [0.20.3] — 2026-06-01

### Fixed
- **Teal strip ghosting off the right edge / blinking.** The 3D effects (cube,
  coverflow) render with `perspective`/`preserve-3d`; their composited iframe
  layer can paint outside the card because `overflow: hidden` doesn't clip a
  composited child in Chrome. Added `contain: paint` to `.card__frame`, which
  forces the compositor to clip the iframe to the card box — no ghost can appear
  outside a card. (Only clips; never skips rendering, so no pop-in flicker.)

## [0.20.2] — 2026-06-01

### Fixed
- **Definitive fix for the hover blink / stray teal layer.** The previous
  attempt (pinning iframes to their own GPU layer) backfired — force-promoting
  172 iframes made Chrome paint a ghost layer off the right edge. Reverted that,
  and **removed the `translateY` lift on card hover entirely**, so no element
  above any `<iframe>` ever transforms. Hover feedback is now border + shadow
  only, which never re-rasterizes the iframe.

## [0.20.1] — 2026-06-01

### Fixed
- **Hover blink that followed the mouse across the gallery.** The `.card:hover`
  lift transforms the card, and Chrome re-rasterizes the `<iframe>` inside a
  transformed ancestor, which flashed. Each iframe is now pinned to its own GPU
  layer (`transform: translateZ(0)` + `backface-visibility: hidden`) so the
  hover transform repositions it on the compositor instead of repainting it.
- Dropped the `backdrop-filter: blur()` on the card "+" button (a second
  flicker source when sampling a live iframe behind it) for a solid background.

## [0.20.0] — 2026-06-01

### Fixed
- **Removed `content-visibility: auto` from cards**, which was causing a
  flickering paint artifact that tracked the mouse across the page (a known
  Chrome bug). The big perf wins (no grid rebuild + lazy-mounted iframes) stand
  on their own without it.

### Added
- **Dynamic facet counts** — every filter value now shows how many results it
  would yield given the *other* active filters (and the search), and values
  that would yield nothing are dimmed. Quick chips update live too.
- **Arrow-key navigation** across the gallery — focus a card and use
  ←/→/↑/↓ to move through the grid.
- **🎲 Surprise me** — opens a random effect (respecting the current filters).

### Performance
- Precompute a lowercased search haystack per effect so filtering/counting
  doesn't rebuild strings on every keystroke.

## [0.19.1] — 2026-06-01

### Accessibility & polish
- The floating filters popover now **manages focus**: opening moves focus to its
  close button; closing (✕, Esc, or click-outside) **restores focus** to the
  launcher (or the “All filters” chip that opened it).
- Moved the polite **live region to the result count** ("38 effects") and removed
  the now-defunct `aria-live` from the grid — filtering no longer rebuilds the
  grid, so the count is the right thing to announce.
- Added bottom padding to the gallery so the **last row of cards clears the
  floating corner buttons**.

## [0.19.0] — 2026-05-31

### Added — Quick filters + polished launcher
- **Quick theme chips** under the toolbar: the six biggest themes as one-tap
  toggles (with counts) plus an “All filters” shortcut that opens the popover.
  Chips stay in sync with the popover and the active-filter count.
- The floating **Filters launcher now reacts to active filters** — accent glow
  + a count pill that pulses when the count changes.
- The filters popover gained a **tail** pointing down to its launcher.

### Performance — gallery no longer rebuilds on every filter
- **Cards are built once and reused.** Filtering/sorting now toggles visibility
  and CSS `order` instead of `grid.innerHTML = ""` + recreating all 172 cards,
  so the effect **iframes are never destroyed and re-fetched** on a filter/sort.
- **Iframes lazy-mount via `IntersectionObserver`** (≈12 load up front instead
  of 172) and offscreen cards skip layout via `content-visibility: auto`.
- Palette application now **skips iframes that haven’t mounted yet**.

## [0.18.0] — 2026-05-31

### Changed — Full-width gallery + floating Filters launcher
- Removed the fixed left filters sidebar so the effect grid spans the **full
  width** (≈4 cards/row instead of 3). The catalogue is the star.
- Filters now live behind a **floating “Filters” button (lower-left)** that pops
  up the theme/technology/difficulty/era/tags list as a popover — with a live
  **active-filter count** badge, “Clear all”, click-outside / ✕ / Esc to close.
- Moved the **bundle button to the lower-right** and tucked the **version badge**
  just above the Filters launcher on the left.

## [0.17.0] — 2026-05-31

### Fixed — Auto-reload actually works now (real root cause)
- The v0.14 cache-busting rewrite had a regex bug: `build.js` also matched
  **inside `build.json`** in the live-reload fetch, corrupting it to
  `assets/build.js?v=Non?t=…`. The fetch failed every time, so the page never
  auto-refreshed after a deploy. Added a `(?=["'?])` lookahead so only true
  filename refs are versioned. (Clients still on the broken build need one manual
  refresh to pick up this fix; auto-reload is permanent thereafter.)

### Added
- **Shareable palette links**: “🔗 Copy link” copies a `#palette=…` URL that
  reopens your exact colors (and applies them) for anyone — teammate or agent.
- **WCAG contrast badge**: live Text-on-Background contrast ratio + AA/AAA rating
  in the palette panel, so you can tell at a glance if a palette is readable.

## [0.16.0] — 2026-05-31

### Changed — Much better randomizer (perceptual OKLCH generation)
- The palette generator now works in **OKLCH** (Ottosson's OKLab) instead of raw
  HSL, with automatic in-gamut chroma. Equal *perceived* lightness across hues
  means no more muddy yellow-greens or blown-out cyans — shuffles look balanced
  and intentional, and backgrounds/text stay consistently dark/light whatever the
  hue. (Researched against coolors/HSLuv/golden-ratio write-ups.)

### Added
- **Evident Apply**: a pulsing **“✓ Apply palette”** button now appears in the
  bar (header level, next to 🎲) the moment you have unapplied changes — so it's
  obvious how to push the palette to everything. Hides once applied.
- **Persisted panel state**: the palette panel remembers open/closed across
  visits.

## [0.15.0] — 2026-05-31

### Added — Apply-on-demand + the catalog themes itself to your palette
- **Apply button**: shuffling, presets, the wheel and lightness now only update
  the palette **bar** (a working copy) — the gallery no longer re-skins on every
  change. Hit **Apply** to commit the palette in one go. This kills the page
  glitch from rapidly mashing 🎲, and lets you audition palettes freely. The
  button reads **“Applied ✓”** until you make another change.
- **“Restyle this site too”** toggle: Apply also maps your palette onto the
  catalog’s own theme — masthead, cards, modal, the palette bar itself — so the
  whole site (an app about design) becomes *your* design. Toggle off to keep the
  site’s default chrome; Reset restores everything.

### Notes on coverage
- Effects that use CSS variables (~135/172) follow the palette via an injected
  `:root` override; ~37 samples use no variables (and many hard-coded colors
  remain), so those can’t follow without per-sample rework. SVGs in the catalog
  don’t use `currentColor`/`var()` fills, so there was nothing to remap there.

## [0.14.1] — 2026-05-31

### Changed — Palette generator redesigned (collapsed by default)
- The palette is now a compact **pill** (icon + live preview swatches + “Customize”
  chevron, plus a quick 🎲 shuffle) that **expands on click** into a polished panel
  — no longer always-open and cramped.
- Expanded panel: large rounded **swatch cards** (role + hex), a wheel **editor that
  opens only when you tap a swatch**, and a tidy controls row with a gradient
  Shuffle, styled Harmony select, segmented Dark/Light, preset chips, an
  **Adapt-gallery toggle switch**, Copy tokens, and Reset.
- Fixed: the editor panel previously ignored its `hidden` attribute (author
  `display:flex` beat the UA `[hidden]` rule) so it always showed; now hidden
  until a swatch is selected.

## [0.14.0] — 2026-05-31

### Added — Standalone Palette bar (coolors-style) that re-skins the whole gallery
- A prominent **Palette bar at the top of the page** with six lockable role
  swatches (Accent, Accent 2, Background, Surface, Text, Muted): tap a swatch to
  edit it on a **color wheel**, 🔒 **lock** to keep it, click a **hex to copy** it.
- **🎲 Shuffle** (button or Spacebar) generates a fresh coherent palette for the
  unlocked roles; **Harmony** (complementary/analogous/triadic/monochrome),
  **Dark/Light** mode, and **8 presets**.
- **Adapt gallery** (on by default once you pick): the chosen palette is applied
  **live to every gallery card** — and the modal preview — so you can see your
  brand across all 172 components. Done by injecting a `<style>` that maps the
  palette onto each sample's `:root` tokens (robust across the real token
  vocabulary), and cleanly removed when you turn Adapt off.
- **📋 Copy tokens** emits an agent-ready `:root { … }` block. The bundle drawer
  now shows a compact read-only summary of the active palette.
- Replaces the palette studio that previously lived inside the Bundle drawer.

### Fixed — Auto-reload after a deploy (no more manual hard refresh)
- The deploy now pins `?v=<build>` onto the asset URLs in the published
  `index.html` (only at deploy, via `SC_DEPLOY=1`; the committed file stays
  query-free), and the live-reload check navigates to a fresh document URL
  instead of `location.reload()`. Together these bypass the CDN/browser cache so
  a new version loads fresh JS/CSS automatically.

## [0.13.0] — 2026-05-31

### Added — Palette Studio (color wheel) in the Brand panel
- An interactive **HSL color wheel** (pick hue + saturation; keyboard-operable)
  plus a **Lightness** slider, **Harmony** selector (complementary / analogous /
  triadic / monochrome), and a **Dark/Light UI** toggle that generates a coherent
  palette — accent, accent-2, background, surface, text, muted.
- **8 preset palettes** (Nebula, Ocean, Ember, Forest, Slate, Candy, Citrus,
  Royal) as one-click swatches; a live 6-swatch preview with hex labels.
- Generating applies to the global Brand palette (maps across the bundle + live
  preview) and fills the per-role controls.
- **Copy palette tokens** outputs a clean `:root { … }` block (with role comments
  + a usage note) — agent-ready. Wheel state reflects a persisted brand on load.
- Verified: wheel/preset/harmony/mode → brand update + sample mapping + copy
  output; zero console errors.

## [0.12.0] — 2026-05-31

### Added — Phase 2: live color & size tuning (pre-fine-tuned copy)
- New **🎚 Tune** tab in each component's modal: auto-generates controls from the
  sample's `:root` variables — color pickers for colors, sliders for lengths,
  text inputs for the rest — with the documented `customization` tokens shown
  first. Editing updates the **live preview** instantly.
- **Global Brand palette** in the Bundle drawer (Accent / Accent 2 / Background /
  Text / Radius) that maps onto each sample's tokens by role aliases — reskin the
  whole bundle in one place; per-sample tweaks override it.
- Tweaks are **rewritten into each sample's `:root` in place**, so the copied
  source and the bundle export come out **pre-fine-tuned** (the bundle also lists
  the customized token values per item).
- Overrides + brand persist in `localStorage` (survive the auto-reload).
- Verified: per-sample edit → live preview + source rewrite + copy + persistence;
  global brand mapping into samples; zero console errors.

## [0.11.0] — 2026-05-31

### Added — Bundle (cart): collect components → copy an agent-ready brief
- Every card gets a **＋ Add** button (and the modal a toggle) to add components
  to a **Bundle**. A floating bundle button shows the count and opens a drawer.
- **Copy for your agent** assembles all selected components into one Markdown
  document — each with its summary, **how-to-apply** notes, tech/deps, customize
  hints, and the full source in a fenced block — ready to paste into a coding
  agent. Also **Download .md**.
- Bundle persists in `localStorage` (survives the auto-reload), the FAB hides
  when empty, Esc closes the drawer, and controls are keyboard/ARIA-friendly.
- Source is fetched on demand from `api/effects/<id>.json` (keeps the eager
  payload small). Verified end-to-end: add, list, copy (8.8 KB brief), persist,
  zero console errors.

_Next: in-sample color/size tuning so copied code comes pre-fine-tuned._

## [0.10.0] — 2026-05-31

### Added — round 4: +16 hand-crafted specimens (now 172 effects)
- **Effects (7):** `text-highlight-sweep`, `image-trail` (cursor image fling),
  `oklch-gradient` (sRGB vs OKLCH interpolation), `split-screen` layout,
  `mega-menu`, `tag-input` (chips), `wave-bars` loader.
- **SVG (3):** `svg-theme-toggle` (sun↔moon morph), `svg-stroke-text`
  (outline→fill), `svg-draw-route` (route draw + traveling marker).
- **Templates (6):** `testimonial-wall`, `changelog-page`, `waitlist-referral`
  (referral loop), `case-study`, `app-landing`, `memphis-playful`.
- Checked existing IDs to avoid collisions; all 16 verified rendering with zero
  console errors; ARIA + focus-visible + reduced-motion throughout. Website
  Templates now 38.

## [0.9.0] — 2026-05-30

### Added — another hand-crafted round: +14 specimens (now 156 effects)
- **Effects (6):** `command-palette` (⌘K), `cursor-text-label` (labeled custom
  cursor), `orbit-loader`, `password-strength` (meter + checklist),
  `corner-brackets` (HUD frame), `blur-up-load` (LQIP progressive image).
- **SVG (3):** `svg-annotation-arrow` (hand-drawn pointer), `svg-like-burst`
  (heart + particle burst), `svg-animated-logo` (stroke-then-fill reveal).
- **Templates (5):** `pricing-page` (billing toggle + comparison + FAQ),
  `docs-portal` (sidebar + scroll-spy TOC + copy code), `error-404` (glitch),
  `podcast-show` (episodes + play states), `real-estate-listing` (filters + grid).
- All verified rendering with zero console errors; ARIA, focus-visible, and
  reduced-motion guards throughout. Website Templates now 32.

## [0.8.0] — 2026-05-30

### Added — library expansion: +19 hand-crafted specimens (now 142 effects)
Researched current trends, then hand-built across effects, SVGs, and templates.
- **Effects (8):** `gradient-border-glow` (animated conic border), `tilt-spotlight-card`
  (3D tilt + cursor spotlight), `grain-gradient` (mesh + film grain), `dot-grid-spotlight`
  (cursor-lit grid), `text-scramble` (decode reveal), `scroll-velocity-skew`
  (momentum skew), `variable-font-weight` (interactive variable type), `otp-input`
  (segmented verification code).
- **SVG (5):** `svg-blob-spinner` (morphing loader), `svg-squiggle-underline`,
  `svg-wave-divider` (layered parallax waves), `svg-progress-ring` (count-up),
  `svg-dashed-connector` (draw + marching-ants flow).
- **Templates (6):** `spatial-depth` (parallax depth), `link-in-bio` (creator hub),
  `event-conference` (speakers + tabbed schedule + tickets), `restaurant-menu`
  (tabbed interactive menu), `anti-design` (maximalist), `skeuomorphic-revival`
  (CSS-only tactile music player).
- All verified rendering with zero console errors; reduced-motion + focus-visible
  throughout. Website Templates now 27.

## [0.7.0] — 2026-05-30

### Changed — hand-crafted, trend-researched templates (replaces the generator)
- Removed `scripts/gen-templates.mjs` and its 132 generated templates. Generated
  palette-swaps lacked authentic variety; replaced with hand-built specimens.
- Added **12 distinct, hand-crafted templates**, each embodying a researched
  2026 design trend + a real use-case, with effects woven in authentically:
  - `aurora-saas` — Aurora UI (animated gradient mesh + glass)
  - `bento-showcase` — Apple-style bento grid product page
  - `swiss-editorial` — Resonant Stark / Swiss typographic studio
  - `glass-fintech` — controlled glassmorphism with a floating app mock
  - `kinetic-portfolio` — cursor-reactive kinetic typography
  - `dopamine-brand` — dopamine / Y2K maximalist beverage brand
  - `clay-app` — claymorphism (soft 3D) wellness app
  - `terminal-devtool` — dark terminal/dev tool with typing animation
  - `synthwave-arcade` — retro-futurism with an animated neon grid
  - `luxe-serif` — quiet-luxury serif hospitality
  - `organic-wellness` — organic/botanical earthy brand
  - `magazine-home` — editorial magazine front page
- Catalog now 123 effects across 22 themes (Website Templates: 21).

## [0.6.0] — 2026-05-30

### Added — 132 premium templates (catalog now 243 effects)
- New `scripts/gen-templates.mjs` generator composes self-contained, full-page
  templates from a library of **12 palettes** (Midnight, Aurora, Glass, Neon,
  Forest, Ocean, Paper, Mono, Pastel, Sunset, Corporate, Brutalist) × **33
  categories** (SaaS, AI startup, agency, portfolio, photographer, restaurant,
  café, bakery, gym, yoga, fashion, store, real estate, interior, architecture,
  law, dental, medical, course, university, nonprofit, conference, festival,
  wedding, musician, podcast, newsletter, travel, hotel, crypto, mobile app,
  game studio, …) → **132 generated templates**.
- Each template **composes catalog effects inline**: animated gradient hero,
  glassmorphic sticky nav, scroll-triggered reveals (IntersectionObserver),
  card hover-lift, a scroll-progress bar, and gradient text — zero dependencies,
  responsive, and `prefers-reduced-motion` safe.

### Changed — leaner gallery payload
- `assets/catalog.js` (eagerly loaded) no longer inlines per-effect `source`;
  the gallery lazy-loads source from `api/effects/<id>.json` when a modal opens.
  Eager payload dropped from ~2.7 MB to ~512 KB despite 2× the effects. Full
  `source` remains in `catalog.json` and the per-effect API files.

## [0.5.0] — 2026-05-30

### Added — Website Templates theme (now 111 effects across 22 themes)
- New **`website-templates`** theme: complete, self-contained, agent-friendly
  page scaffolds spanning genres and eras:
  - `saas-landing` — modern SaaS marketing page (hero, bento, pricing).
  - `portfolio-minimal` — editorial creative portfolio.
  - `blog-article` — readable long-form article layout.
  - `admin-dashboard` — app shell with KPIs, CSS chart, and data table.
  - `ecommerce-product` — product detail page (gallery + buy box).
  - `coming-soon` — pre-launch page with live countdown + email capture.
  - `web2-glossy` — mid-2000s Web 2.0 homage (glossy buttons, BETA badge).
  - `retro-90s-homepage` — 90s GeoCities homage (starfield, marquee, counter,
    webring) using accessible, non-deprecated techniques.
  - `neubrutalist-landing` — 2020s neubrutalism (hard shadows, clashing brights).
- Each template documents how an agent should reskin it (tokens + content
  regions) and keeps semantic landmarks, focus styles, and reduced-motion guards.

## [0.4.0] — 2026-05-30

### Added — SVG Effects theme (now 102 effects across 21 themes)
- New **`svg-effects`** theme covering vector-graphics techniques beyond plain
  CSS:
  - `svg-line-draw` — self-drawing stroke (logos/signatures).
  - `svg-gooey-filter` — metaball merge via feGaussianBlur + feColorMatrix.
  - `svg-path-morph` — shape tweening with SMIL `animate` on `d`.
  - `svg-turbulence-distortion` — feTurbulence + feDisplacementMap warp.
  - `svg-text-on-path` — curved/circular text via `textPath`.
  - `svg-gradient-stroke` — gradient-stroked spinner/progress ring.
  - `svg-animated-checkmark` — success draw-in confirmation.
  - `svg-noise-texture` — film-grain overlay from feTurbulence (no asset).
- SMIL-based specimens pause animation under `prefers-reduced-motion` via
  `svg.pauseAnimations()`; CSS-based ones use the standard media guard.

## [0.3.0] — 2026-05-30

### Added — Programmatic access (roadmap v3) + glossary
- **Split, fetchable API** generated by the build:
  - `api/index.json` — lightweight effect summaries (no `source`) for discovery.
  - `api/effects/<id>.json` — one full record per effect.
  - `api/themes.json` — themes + facets.
- **Zero-dependency MCP server** (`mcp/server.mjs`, `npm run mcp`): pure-Node
  stdio JSON-RPC exposing `list_themes`, `search_effects`, and `get_effect`.
  Docs in `mcp/README.md`.
- **Glossary & taxonomy** reference at `docs/GLOSSARY.md`.
- CI staleness check now also covers the generated `api/` tree.

### Added — More effects (now 94 across 20 themes)
- glass-neumorphism (+glass-button, +neumorphic-button), scroll-effects
  (+scroll-snap-gallery, +reveal-image-clip), transitions-animations
  (+accordion-expand, +modal-fade-scale), hover-interactions
  (+grayscale-to-color), typography-systems (+readable-measure),
  motion-principles (+stagger-choreography).

## [0.2.0] — 2026-05-30

### Changed
- Build output is now **deterministic** (dropped the volatile `generatedAt`
  timestamp from the committed artifacts) so the CI staleness check passes.

### Added — Expansion to 85 effects across 20 themes
- **Combination Recipes** (new, 4): full composed UI blocks — hero section,
  pricing card, glass navbar, login card. Demonstrates composing primitives.
- **Forms & Inputs** (new, 4): floating-label input, toggle switch, animated
  checkbox, custom range slider — all built on real, accessible controls.
- **First "beyond HTML/CSS" design-system domains** (roadmap v2):
  - **Color Systems** (3): semantic color tokens, gradient library, dark/light
    mode tokens.
  - **Typography Systems** (3): modular type scale, fluid typography, font
    pairings.
  - **Layout Archetypes** (4): bento grid, responsive card grid, holy grail,
    masonry.
  - **Motion Principles** (2): easing curve showcase, duration scale.
- Grew existing themes: text-effects (+outline), buttons (+arrow-slide,
  +loading), backgrounds (+wavy-divider), loaders (+progress-ring), images
  (+ken-burns), cursors (+blob-trail), 3d (+carousel), navigation
  (+sliding-tab-indicator, +dropdown-menu).

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
