# Style Catalog MCP Server

A **zero-dependency** [Model Context Protocol](https://modelcontextprotocol.io)
server (pure Node, stdio transport) that lets an AI agent query the catalog
directly instead of reading the whole `catalog.json`.

## Tools

| Tool | Args | Returns |
|---|---|---|
| `list_themes` | — | Themes with counts + descriptions |
| `search_effects` | `query?`, `theme?`, `tag?`, `tech?`, `difficulty?`, `era?`, `limit?` | Lightweight effect summaries (AND-combined filters) |
| `get_effect` | `id` | One effect's full record incl. runnable `source` + `ai_usage` |

## Run

```bash
npm run build      # ensure catalog.json is current
npm run mcp        # starts the stdio server
```

The server reads `catalog.json` at the repo root, so run `npm run build` first
(or whenever you add effects).

## Wire it into a client

**Claude Code** (`.mcp.json` or `claude mcp add`):

```json
{
  "mcpServers": {
    "style-catalog": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "cwd": "/absolute/path/to/style-catalog"
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`): same `mcpServers` block with
an absolute path in `args`.

## Protocol notes

- Transport: stdio, newline-delimited JSON-RPC 2.0.
- Implements `initialize`, `tools/list`, `tools/call`, `ping`, and ignores
  `notifications/*`.
- No SDK and no network access — it only reads the local `catalog.json`.

## Quick manual smoke test

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_effects","arguments":{"query":"neon"}}}' \
  | node mcp/server.mjs
```
