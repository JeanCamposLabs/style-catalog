# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for an
unfixed vulnerability.

- Preferred: open a [GitHub Security Advisory](https://github.com/jeancamposlabs/style-catalog/security/advisories/new).
- Or email: **jean@easyscalemedia.com**

We aim to acknowledge reports within 5 business days.

## Scope & threat model

The published artifact is a **static, zero-runtime-dependency** site (HTML, CSS,
vanilla JS) plus generated JSON. There is no server, database, or user auth in
the runtime.

Relevant surfaces:

- **Effect specimens** (`effects/**`) render inside **sandboxed iframes**
  (`sandbox="allow-scripts allow-same-origin"`) and must be fully self-contained
  (no external/CDN resources). Effect metadata is authored in-repo and treated
  as trusted; all of it is HTML-escaped before injection into the gallery DOM.
- **Build/dev tooling** (`scripts/**`) and the **MCP server** (`mcp/server.mjs`)
  run locally. The MCP server is read-only over `catalog.json` and does not read
  arbitrary files or accept network input.

When reporting, note whether the issue affects the published site, the tooling,
or the MCP server.

## Supported versions

Only the latest `main` (and the live GitHub Pages deploy) is supported.
