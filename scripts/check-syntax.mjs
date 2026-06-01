// Zero-dependency syntax gate: `node --check` every first-party JS/MJS file.
// Not a full linter (the project deliberately ships no lint toolchain), but it
// catches parse errors before they reach CI or the browser. See ROADMAP.md for
// the planned ESLint/Prettier adoption.

import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".git", "effects", "api"]);
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if ([".js", ".mjs"].includes(extname(name))) files.push(p);
  }
}
walk(ROOT);

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    failed++;
    console.error("✗ " + f.replace(ROOT + "/", "") + "\n" + (e.stderr || e.message).toString());
  }
}

if (failed) {
  console.error(`\n✗ ${failed} file(s) failed the syntax check.`);
  process.exit(1);
}
console.log(`✓ Syntax OK across ${files.length} JS/MJS files.`);
