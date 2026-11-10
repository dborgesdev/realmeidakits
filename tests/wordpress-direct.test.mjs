import { URL } from "node:url";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initialDraft, makeParticipant } from "../src/state/draft.ts";
import { makeSelection } from "../src/state/selectionRules.ts";
import { events } from "./fixtures/events.ts";
import { resizeParticipants } from "../src/state/participantRules.ts";
import { firstIssue } from "../src/state/validationRules.ts";
import { personReady, responsibleReady } from "../src/state/requestRules.ts";
test("new drafts and additional people contain no fabricated identities, documents or enrollment", () => {
  const draft = resizeParticipants(initialDraft(), 2);
  assert.equal(draft.order, undefined);
  assert.ok(
    draft.participants.every((p) =>
      Object.values(p.person).every((v) => v === ""),
    ),
  );
  assert.deepEqual(draft.participants[0].existingDocumentIds, []);
  assert.ok(Object.values(draft.responsible).every((v) => v === ""));
  const item = makeSelection(events[0]);
  assert.equal(item.membership, "");
  assert.equal(item.registration, "");
  assert.notEqual(makeParticipant(1).id, makeParticipant(2).id);
});
test("contact validation targets actual editable controls without demo-only formats", () => {
  const draft = initialDraft();
  assert.equal(
    firstIssue("responsavel", draft, events).target,
    "responsible-name",
  );
  draft.responsible.name = "Teste local";
  assert.equal(
    firstIssue("responsavel", draft, events).target,
    "responsible-email",
  );
  draft.responsible.email = "qa@example.invalid";
  assert.equal(
    firstIssue("responsavel", draft, events).target,
    "responsible-phone",
  );
  assert.equal(responsibleReady(draft.responsible), false);
  assert.equal(personReady(draft.participants[0].person), false);
});
test("operational entry has no simulated completion, mock imports or alternate backend configuration", () => {
  const context = readFileSync(
    new URL("../src/state/RequestContext.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(context, /data\/(demo|events)|finalizeOrder|complete:/);
  const page = readFileSync(
    new URL("../src/pages/RequestPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /<PaymentStep/);
  const vite = readFileSync(
    new URL("../vite.config.ts", import.meta.url),
    "utf8",
  );
  assert.match(vite, /command === "serve" \? env\.RAK_DEV_REPLICA/);
});
