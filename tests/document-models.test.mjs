import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { normalizeRace } from "../src/data/normalizeRace.ts";
import {
  configuredDocuments,
  requiredDocuments,
} from "../src/state/requestRules.ts";
import { makeSelection } from "../src/state/selectionRules.ts";
const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/wordpress-race.json", import.meta.url),
    "utf8",
  ),
);
function withTemplate(
  url = "https://app.example.invalid/wp-admin/admin-post.php?action=rak_public_model&attachment=10",
) {
  const copy = JSON.parse(JSON.stringify(fixture));
  Object.assign(copy.modalities[0].documents[0], {
    purpose: "Autorização de retirada",
    requiresUpload: true,
    version: 2,
    template: { url, name: "demonstracao-modelo.pdf", mime: "application/pdf" },
  });
  return copy;
}
test("public PDF metadata normalizes with same-origin WordPress download and preserves version", () => {
  const race = normalizeRace(
    withTemplate(),
    "https://app.example.invalid/wp-json/re-almeida/v1",
  );
  const doc = race.modalities[0].documents[0];
  assert.equal(doc.template.mime, "application/pdf");
  assert.equal(doc.version, 2);
  assert.equal(doc.requiresUpload, true);
});
test("templates reject external origin, arbitrary paths, credentials, scripts and invalid MIME", () => {
  for (const url of [
    "javascript:alert(1)",
    "https://untrusted.invalid/wp-admin/admin-post.php?action=rak_public_model&attachment=10",
    "https://app.example.invalid/private.pdf",
    "https://token@app.example.invalid/wp-admin/admin-post.php?action=rak_public_model&attachment=10",
    "https://app.example.invalid/wp-admin/admin-post.php?action=other&attachment=10",
  ])
    assert.throws(() =>
      normalizeRace(
        withTemplate(url),
        "https://app.example.invalid/wp-json/re-almeida/v1",
      ),
    );
  const bad = withTemplate();
  bad.modalities[0].documents[0].template.mime = "text/html";
  assert.throws(() => normalizeRace(bad));
});
test("missing optional template remains absent and legacy payload keeps upload requirements", () => {
  const race = normalizeRace(fixture);
  const doc = race.modalities[0].documents[0];
  assert.equal(doc.template, null);
  assert.equal(doc.requiresUpload, true);
});
test("informational and optional requirements stay visible without blocking document completion", () => {
  const race = normalizeRace(withTemplate());
  const selection = makeSelection(race, "oficial");
  race.modalities[0].documents[0].requiresUpload = false;
  race.modalities[0].documents.push({
    id: "optional-demo",
    label: "DEMONSTRAÇÃO opcional",
    scope: "race",
    required: false,
    requiresUpload: true,
  });
  assert.equal(configuredDocuments(selection, race).length, 2);
  assert.equal(requiredDocuments(selection, race).length, 0);
});
