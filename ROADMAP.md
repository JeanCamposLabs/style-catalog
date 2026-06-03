# ROADMAP — Style Catalog

> The full product vision lives in [`PLAN.md`](PLAN.md). This document is the
> **growth + hardening plan**: how the catalog goes from a polished single-site
> museum to the default, machine-consumable source of web-design effects — and
> what "enterprise-ready" concretely means along the way.

## Thesis

The catalog's moat is **machine-consumability**: every effect is self-contained,
validated, and described in agent-readable language (`ai_usage`, `customization`,
`related`). Exponential growth comes from **distribution + content scale**, not
from a single nicer gallery. Three flywheels:

1. **Content** — more effects → more search/SEO surface → more reach → more
   contributions. Automate authoring + validation so adding effects is cheap and
   always safe.
2. **Distribution** — meet consumers where they already are (npm, CDN, MCP
   clients, IDEs, frameworks, design tools) so the catalog is reachable without
   visiting the site.
3. **Agent-native** — be the library an AI reaches for by default: a hosted MCP
   endpoint, semantic search, and a "compose these effects" capability.

Each phase below lists **deliverables** and the **success metric** that proves
the flywheel is turning.

---

## Phase 0 — Foundation hardening *(in progress)*

Make the core trustworthy enough to build on. Most of this shipped in the
enterprise-readiness pass:

- ✅ Data integrity: `related` cross-references validated in the build (no dead
  links can ship).
- ✅ Schema enforcement parity: unknown fields, `customization` shape, enums,
  uniqueness, id/filename + theme/folder agreement all validated.
- ✅ Test suite (`node --test`, zero-dep): catalog validator + MCP protocol/tools.
- ✅ CI quality gate: syntax check + tests + generated-file freshness, least
  privilege, install-free.
- ✅ Tooling robustness: dev-server no longer leaks paths / 400s on bad URLs;
  poster script fails cleanly; MCP `limit` clamped.
- ✅ A11y: dialog focus-trap (modal / cart / filters).
- ✅ Single-source version (`package.json`), Dependabot, SECURITY.md, CODEOWNERS,
  templates, `.editorconfig`.

**Remaining Phase-0 backlog** (from the audit, deferred deliberately):

| Item | Why deferred | Target |
|---|---|---|
| ESLint + Prettier | Adds a toolchain + install step; today's gate is `node --check`. Adopt with a flat config that respects `app.js`'s intentional ES5 idiom. | Phase 1 |
| Visual-regression on posters | Needs Playwright in CI + snapshot storage. | Phase 1 |
| Automated a11y scan (axe) in CI | Needs a browser in CI. | Phase 1 |
| Pin Actions to commit SHAs | Dependabot (`github-actions`) now keeps them current; SHA-pin once that cadence is established. | Phase 1 |
| Branch protection on `main` | Repo-settings change (not in-tree). Document + enable. | Phase 0 |

**Success metric:** green CI on every PR; zero schema/data regressions reach `main`.

---

## Phase 1 — Distribution: be consumable everywhere

Stop requiring a site visit. Ship the catalog as packages and endpoints.

- **npm package** `@style-catalog/catalog` — publishes `catalog.json` + the
  `api/` tree + typed accessors (`getEffect`, `searchEffects`). Versioned with
  the library. Enables `npm i` + import in any toolchain.
- **CDN access** — document jsDelivr/unpkg URLs for `catalog.json` and
  `api/effects/<id>.json`; add cache headers + an immutable, versioned path
  (`/v1/...`) so consumers can pin.
- **Stable, versioned data API** — freeze the JSON shape behind `schemaVersion`;
  add a JSON Schema for `catalog.json` itself (we only schema the per-effect
  meta today) and validate the built output against it in CI.
- **Per-effect static pages** — generate `/<theme>/<id>.html` landing pages from
  the catalog (live preview + copy buttons + metadata + JSON-LD `SoftwareSourceCode`).
  Massive SEO surface; each effect becomes an indexable, shareable URL with its
  own OG image (extend the poster pipeline to render OG cards).
- **Release automation** — Changesets or semantic-release driven by Conventional
  Commits; auto-CHANGELOG, auto-tag, auto-npm-publish with provenance
  (`npm publish --provenance`).
- **TypeScript types** — ship `.d.ts` for the catalog/effect shape (generated
  from the schema) so consumers get autocomplete.

**Success metric:** weekly npm downloads + CDN hits; first external project
importing the package; per-effect pages indexed by search engines.

---

## Phase 2 — Agent-native: the default AI design source

Make the catalog the obvious tool for an agent building UI.

- **Hosted MCP server** — deploy the stdio server behind a remote MCP transport
  (HTTP/SSE) and list it in the public MCP registry, so any MCP client can add
  it without local setup.
- **Semantic search** — precompute embeddings for each effect (`title + summary
  + description + ai_usage`) at build time; ship a static vector index for
  client-side similarity search and a `find_similar` MCP tool. Keeps the
  zero-runtime-dependency gallery while making `related` data-driven instead of
  hand-curated.
- **Compose endpoint/tool** — `compose_effects([ids])` returns a single merged,
  de-conflicted HTML/CSS bundle (namespaced classes, merged tokens) — the bundle
  feature, but as an API for agents.
- **Richer tool surface** — pagination (`offset`), `list_facets`, `get_schema`,
  and structured `customization` so agents can tune without parsing source.
- **Eval harness** — a benchmark that asks an agent to "build X" and measures
  whether it correctly selects + integrates a catalog effect; track regressions
  as the catalog and `ai_usage` text evolve.

**Success metric:** installs from the MCP registry; tool-call volume; eval pass
rate trending up.

---

## Phase 3 — Content scale & community flywheel

Grow the collection without growing the maintenance burden linearly.

- **Authoring pipeline** — an agent-assisted scaffold that takes a prompt/spec →
  drafts a self-contained effect → auto-runs `validate` + a11y + poster render →
  opens a PR. Humans review; the bar (self-contained, reduced-motion, escapes
  cleanly) is machine-enforced.
- **Contribution flow** — preview deploys per PR (PR → temporary Pages/Netlify
  preview), the PR template checklist, and a "good first effect" funnel.
- **Quality ranking** — replace/augment the hand-tuned `wowScore` with usage
  signals (effect-page views, copy/bundle events, npm/MCP fetch counts) gathered
  privacy-respectfully; surface "trending" and "most-used".
- **Framework adapters** — generate React/Vue/Svelte/Web-Component wrappers per
  effect from the source, published under the npm scope, so the catalog plugs
  into component libraries directly.
- **Design-tool reach** — a Figma/Tailwind/VS Code surface that searches the
  catalog and inserts an effect.

**Success metric:** effect count growth rate with **zero** rise in
per-effect maintenance time; share of effects contributed externally.

---

## Continuous: enterprise tracks (run across all phases)

- **Testing pyramid** — unit (validator, accessors) → integration (MCP, build
  output vs. committed) → e2e (Playwright: search/filter/modal/bundle/palette) →
  visual-regression (posters) → a11y (axe) → eval (agent integration). Coverage
  reported in CI.
- **Performance budgets** — enforce JS/CSS size + Lighthouse thresholds in CI;
  keep the gallery dependency-free and fast (poster-first grid already minimizes
  iframe cost).
- **Security & supply chain** — Content-Security-Policy + SRI on the deployed
  site; `npm publish --provenance` + SLSA attestation; CodeQL + Dependabot;
  document the iframe sandbox threat model (started in `SECURITY.md`).
- **Observability** — privacy-respecting analytics on the site/API to feed
  ranking and prioritization; uptime/latency SLOs on the hosted MCP endpoint.
- **Accessibility** — WCAG 2.2 AA target for the gallery; per-effect a11y notes
  validated; reduced-motion enforced (already required for motion effects).
- **Governance** — semantic data-API versioning, deprecation policy, CODEOWNERS
  review on `scripts/`, `schema/`, `mcp/`, and CI.

---

## Sequencing summary

| Horizon | Focus | Headline deliverables |
|---|---|---|
| **Now** | Finish Phase 0 | ESLint/Prettier, branch protection, a11y+visual CI |
| **Next** | Phase 1 | npm package, per-effect pages, release automation, data-API schema |
| **Later** | Phase 2 → 3 | Hosted MCP + semantic search, authoring pipeline, framework adapters |

The ordering is deliberate: **make the data bulletproof (P0) → make it reachable
(P1) → make it agent-native (P2) → scale the content engine (P3).** Distribution
before content scale, because reach is what turns each new effect into
compounding growth.
