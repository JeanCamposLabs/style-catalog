// Unit + integration tests for the catalog scanner/validator.
// Zero dependencies — runs on Node's built-in test runner: `node --test`.

import { test } from "node:test";
import assert from "node:assert/strict";
import { scanCatalog, validateMeta } from "../scripts/lib/catalog.mjs";

const CTX = { rel: "effects/x/y.html", fileSlug: "y", themeSlug: "x" };
function validMeta(over = {}) {
  return {
    id: "y", title: "Y", summary: "s", theme: "x",
    categories: ["c"], tags: ["t"], tech: ["css"],
    difficulty: "beginner", ai_usage: "use it",
    ...over,
  };
}

test("the real library scans clean", () => {
  const { catalog, errors } = scanCatalog();
  assert.deepEqual(errors, [], "scanCatalog should report no errors:\n" + errors.join("\n"));
  assert.ok(catalog.effects.length > 0);
  assert.equal(catalog.counts.effects, catalog.effects.length);
  assert.equal(catalog.counts.themes, catalog.themes.length);
});

test("every effect id is unique", () => {
  const { catalog } = scanCatalog();
  const ids = catalog.effects.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids found");
});

test("every related id resolves to a real effect", () => {
  const { catalog } = scanCatalog();
  const ids = new Set(catalog.effects.map((e) => e.id));
  const dangling = [];
  for (const e of catalog.effects)
    for (const r of e.related || []) if (!ids.has(r)) dangling.push(`${e.id} -> ${r}`);
  assert.deepEqual(dangling, [], "dangling related refs: " + dangling.join(", "));
});

test("validateMeta accepts a well-formed effect", () => {
  const errors = [];
  validateMeta(validMeta(), CTX, errors);
  assert.deepEqual(errors, []);
});

test("validateMeta rejects unknown fields (typo guard)", () => {
  const errors = [];
  validateMeta(validMeta({ discription: "oops" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes('unknown field "discription"')));
});

test("validateMeta rejects missing required fields and bad enums", () => {
  let errors = [];
  validateMeta(validMeta({ ai_usage: "" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes('missing required field "ai_usage"')));

  errors = [];
  validateMeta(validMeta({ difficulty: "wizard" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes("difficulty")));

  errors = [];
  validateMeta(validMeta({ tech: ["css", "rust"] }), CTX, errors);
  assert.ok(errors.some((e) => e.includes('tech "rust"')));
});

test("validateMeta enforces id/filename and theme/folder agreement", () => {
  let errors = [];
  validateMeta(validMeta({ id: "other" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes("does not match file name")));

  errors = [];
  validateMeta(validMeta({ theme: "wrong" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes("does not match folder")));
});

test("validateMeta checks customization item shape", () => {
  let errors = [];
  validateMeta(validMeta({ customization: [{ name: "--x" }] }), CTX, errors);
  assert.ok(errors.some((e) => e.includes('missing "description"')));

  errors = [];
  validateMeta(validMeta({ customization: [{ description: "no name" }] }), CTX, errors);
  assert.ok(errors.some((e) => e.includes('missing "name"')));

  errors = [];
  validateMeta(validMeta({ customization: "nope" }), CTX, errors);
  assert.ok(errors.some((e) => e.includes("must be an array")));
});

test("validateMeta rejects non-kebab-case ids", () => {
  const errors = [];
  validateMeta(validMeta({ id: "Y_Bad", fileSlug: "Y_Bad" }), { ...CTX, fileSlug: "Y_Bad" }, errors);
  assert.ok(errors.some((e) => e.includes("not kebab-case")));
});
