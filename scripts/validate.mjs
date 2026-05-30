// Validate the catalog without writing anything. CI-friendly.
// Usage: node scripts/validate.mjs

import { scanCatalog } from "./lib/catalog.mjs";

const { catalog, errors } = scanCatalog();

if (errors.length) {
  console.error(`\n✗ ${errors.length} validation error(s):\n`);
  for (const e of errors) console.error("  - " + e);
  console.error("");
  process.exit(1);
}

console.log(
  `✓ Valid: ${catalog.counts.effects} effects across ${catalog.counts.themes} themes, no errors.`,
);
