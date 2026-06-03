// Integration tests for the MCP stdio server. Spawns the real server, speaks
// newline-delimited JSON-RPC, and asserts protocol + tool behaviour.
// Zero dependencies — `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER = join(ROOT, "mcp", "server.mjs");

// Send a batch of requests, collect one response per line, resolve when we've
// seen responses for every request id we sent.
function rpc(requests) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [SERVER], { cwd: ROOT });
    const wantIds = new Set(requests.filter((r) => r.id !== undefined).map((r) => r.id));
    const byId = {};
    let buf = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error("MCP server timed out")); }, 10000);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id !== undefined) byId[msg.id] = msg;
        if (wantIds.size && [...wantIds].every((id) => byId[id])) {
          clearTimeout(timer); child.kill(); resolve(byId);
        }
      }
    });
    child.on("error", reject);
    for (const r of requests) child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...r }) + "\n");
  });
}

test("initialize returns protocol version and server info", async () => {
  const res = await rpc([{ id: 1, method: "initialize", params: {} }]);
  assert.equal(res[1].result.protocolVersion, "2024-11-05");
  assert.equal(res[1].result.serverInfo.name, "style-catalog");
});

test("tools/list advertises the three tools", async () => {
  const res = await rpc([{ id: 1, method: "tools/list" }]);
  const names = res[1].result.tools.map((t) => t.name).sort();
  assert.deepEqual(names, ["get_effect", "list_themes", "search_effects"]);
});

test("unknown method returns -32601", async () => {
  const res = await rpc([{ id: 7, method: "does/not/exist" }]);
  assert.equal(res[7].error.code, -32601);
});

test("search_effects clamps a negative limit instead of misbehaving", async () => {
  const res = await rpc([
    { id: 1, method: "tools/call", params: { name: "search_effects", arguments: { limit: -1 } } },
  ]);
  const payload = JSON.parse(res[1].result.content[0].text);
  // A raw slice(0,-1) would return total-1 rows; the clamp caps it at 1.
  assert.equal(payload.results.length, 1);
  assert.ok(payload.total > 1);
});

test("search_effects caps an oversized limit at 100", async () => {
  const res = await rpc([
    { id: 1, method: "tools/call", params: { name: "search_effects", arguments: { limit: 99999 } } },
  ]);
  const payload = JSON.parse(res[1].result.content[0].text);
  assert.ok(payload.results.length <= 100);
});

test("get_effect rejects a path-traversal id without leaking files", async () => {
  const res = await rpc([
    { id: 1, method: "tools/call", params: { name: "get_effect", arguments: { id: "../../../etc/passwd" } } },
  ]);
  const text = res[1].result.content[0].text;
  assert.match(text, /No effect with id/i);
  assert.doesNotMatch(text, /root:/); // never echoes /etc/passwd contents
});

test("get_effect returns a full record for a real id", async () => {
  const list = await rpc([{ id: 1, method: "tools/call", params: { name: "search_effects", arguments: { limit: 1 } } }]);
  const firstId = JSON.parse(list[1].result.content[0].text).results[0].id;
  const res = await rpc([
    { id: 2, method: "tools/call", params: { name: "get_effect", arguments: { id: firstId } } },
  ]);
  const effect = JSON.parse(res[2].result.content[0].text);
  assert.equal(effect.id, firstId);
  assert.ok(effect.source && effect.source.includes("<!DOCTYPE html"));
});

test("unknown tool name fails with invalid params", async () => {
  const res = await rpc([{ id: 1, method: "tools/call", params: { name: "nope", arguments: {} } }]);
  assert.equal(res[1].error.code, -32602);
});
