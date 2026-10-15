import { test } from "node:test";
import assert from "node:assert/strict";
import { fileError } from "../src/state/rules.ts";
import { documentsReady, dataReady } from "../src/state/requestRules.ts";
test("review requires the specific event documents and authorization", () => {
  const docs = {
    "Comprovante de inscrição": "demo",
    "Documento com foto": "demo",
  };
  assert.equal(documentsReady(docs, false, false), true);
  assert.equal(documentsReady(docs, true, true), false);
  assert.equal(
    documentsReady({ ...docs, "Autorização específica": "demo" }, true, false),
    false,
  );
  assert.equal(
    documentsReady({ ...docs, "Autorização específica": "demo" }, true, true),
    true,
  );
  assert.equal(
    documentsReady({ a: "demo", b: "demo", c: "demo" }, true, true),
    false,
  );
});
test("document validation rejects unsupported types and oversize files", () => {
  assert.ok(fileError({ type: "text/html", size: 10 }));
  assert.ok(fileError({ type: "application/pdf", size: 6 * 1024 * 1024 }));
  assert.equal(fileError({ type: "image/png", size: 1024 }), "");
});

const draft = {
  name: "Participante demo",
  modality: "appai",
  membership: "DEMO-101",
  kit: "camiseta",
  size: "M",
  birthDate: "1990-01-01",
  phone: "DEMO-TELEFONE",
};
const required = { birthDateRequired: true, phoneRequired: true };
test("APPAI requires membership and shirt size only for the shirt option", () => {
  assert.equal(dataReady(draft, required), true);
  assert.equal(dataReady({ ...draft, membership: "101" }, required), false);
  assert.equal(dataReady({ ...draft, size: "" }, required), false);
  assert.equal(
    dataReady({ ...draft, kit: "numero", size: "" }, required),
    true,
  );
  assert.equal(dataReady({ ...draft, kit: "outro" }, required), false);
});
test("official kit ignores APPAI fields and respects conditional personal fields", () => {
  const official = {
    ...draft,
    modality: "oficial",
    membership: "",
    kit: "",
    size: "",
  };
  assert.equal(dataReady(official, required), true);
  assert.equal(
    dataReady({ ...official, birthDate: "2000-02-30" }, required),
    false,
  );
  assert.equal(dataReady({ ...official, name: " " }, required), false);
  assert.equal(dataReady({ ...official, birthDate: "" }, required), false);
  assert.equal(
    dataReady({ ...official, birthDate: "2999-01-01" }, required),
    false,
  );
  assert.equal(dataReady({ ...official, phone: "" }, required), false);
  assert.equal(
    dataReady(
      { ...official, birthDate: "", phone: "" },
      { birthDateRequired: false, phoneRequired: false },
    ),
    true,
  );
});
