# Contributing to Style Catalog

Thanks for adding to the museum! Every contribution is a self-contained
specimen of a web effect. This guide covers humans; AI agents should also read
[`AGENTS.md`](AGENTS.md).

## The golden rules

1. **One file, fully self-contained.** An effect is a single `.html` file under
   `effects/<theme>/`. It must render with **no external resources** — inline
   the CSS and JS, no CDN links. `dependencies` should be `[]`.
2. **Metadata block is mandatory.** Include exactly one
   `<script type="application/json" id="effect-meta">…</script>` matching
   `schema/effect-meta.schema.json`.
3. **It must demo itself.** The file is shown as a live miniature in a ~16:10
   iframe. Center/frame the effect so it's legible at a glance.
4. **Respect motion preferences.** Wrap animations so they calm down under
   `@media (prefers-reduced-motion: reduce)`.
5. **Write the `ai_usage` field for real.** Explain when to use the effect, how
   to integrate it, what to tweak, and what to avoid.

## Workflow

```bash
# scaffold
npm run new -- buttons my-fancy-button "My Fancy Button"

# edit effects/buttons/my-fancy-button.html
#   - fill in the metadata block
#   - write the <style> and markup

# regenerate the index + validate
npm run build
npm run validate

# preview
npm run serve   # http://localhost:4321
```

## Metadata field reference

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | kebab-case, **must equal the file name** |
| `title` | ✓ | human name |
| `summary` | ✓ | one line, shown on the card |
| `description` | | longer prose |
| `theme` | ✓ | **must equal the parent folder** |
| `categories` | ✓ | broad groupings (≥1) |
| `tags` | ✓ | search keywords (≥1) |
| `tech` | ✓ | `css` `js` `html` `svg` `canvas` `webgl` |
| `era` | | `1990s` `2000s` `2010s` `2020s` `timeless` |
| `difficulty` | ✓ | `beginner` `intermediate` `advanced` |
| `dependencies` | | external libs — prefer empty |
| `browser_support` | | compatibility notes |
| `performance_notes` | | repaint / GPU / cost notes |
| `accessibility_notes` | | reduced-motion, contrast, etc. |
| `customization` | | `[{ name, description, default }]` — the knobs |
| `variations` | | ideas for adapting it |
| `related` | | other effect ids |
| `ai_usage` | ✓ | instructions to a consuming AI agent |

## Adding a new theme

Create `effects/<new-theme>/_theme.json`:

```json
{ "title": "My Theme", "description": "What lives here.", "order": 50, "icon": "✨" }
```

Then drop effect files alongside it. `order` controls sidebar position.

## Quality bar

- Prefer modern, dependency-free CSS; use JS only when the effect needs it.
- Keep specimens small and focused — one idea per file.
- Make the demo readable on a dark background unless the effect dictates
  otherwise.
- Validation must pass (`npm run validate`) before a PR is merged; CI enforces
  it.
