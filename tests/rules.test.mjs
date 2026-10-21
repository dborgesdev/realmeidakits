import { Buffer } from "node:buffer";
import { test } from "node:test";
import assert from "node:assert/strict";
import { events as fixtures } from "../src/data/events.ts";
import { initialDraft } from "../src/data/demo.ts";
import {
  selectForNewOrder,
  toggleSelection,
  makeSelection,
  changeSelection,
  isAvailable,
} from "../src/state/selectionRules.ts";
import {
  optionsReady,
  personReady,
  documentsReady,
  requiredDocuments,
  pendingStage,
  conditionsReady,
} from "../src/state/requestRules.ts";
import { itemPrice, totalPrice } from "../src/state/pricing.ts";
import { trackingItems } from "../src/state/trackingRules.ts";
import {
  resizeParticipants,
  removeParticipant,
  assignRace,
  voucherId,
  registrationCount,
} from "../src/state/participantRules.ts";
import { previewConfig } from "../src/config/preview.ts";
import { finalizeOrder, editableUpdate } from "../src/state/orderRules.ts";
import { groupUrl } from "../src/state/voucherRules.ts";
import { selectionEstimate } from "../src/state/pricing.ts";
import {
  acceptCondition,
  conditionVersion,
} from "../src/state/conditionRules.ts";
import {
  firstIssue,
  controlId,
  missingDocuments,
} from "../src/state/validationRules.ts";
import { fileError } from "../src/state/rules.ts";
const events = fixtures.map((race) => ({
  ...race,
  closesAt:
    race.status === "open" ? "2099-11-20T18:00:00-03:00" : race.closesAt,
}));
const [rio, primavera, cidade, closed] = events;
function configured(race, mode = "oficial") {
  const item = makeSelection(race, mode);
  return {
    ...item,
    distance: race.distances[0],
    kitType: race.kitTypes[0] || "",
    pickup: race.pickupLocations[0] || "",
    size: race.modalities.find((m) => m.id === item.modality).sizes[0] || "",
  };
}

function completeDraft(count = 1) {
  let d = resizeParticipants(initialDraft(), count);
  d.selectedRaceIds = [rio.id, primavera.id, cidade.id];
  d.participants = d.participants.map((p, index) => ({
    ...p,
    documents: { identity: "demo" },
    items: (index === 0
      ? [
          configured(rio),
          configured(primavera, "appai"),
          { ...configured(cidade, "appai"), kit: "numero", size: "" },
        ]
      : [configured(rio, "appai")]
    ).map((item) => {
      const race = events.find((r) => r.id === item.raceId);
      return {
        ...item,
        documents: Object.fromEntries(
          requiredDocuments(item, race)
            .filter((doc) => doc.scope === "race")
            .map((doc) => [doc.id, "demo"]),
        ),
      };
    }),
  }));
  for (const race of events.filter((r) => d.selectedRaceIds.includes(r.id)))
    for (const condition of race.conditions)
      d = acceptCondition(d, race, condition.id, true);
  return d;
}
test("individual order keeps responsible and participant separate", () => {
  const d = completeDraft();
  assert.equal(d.participants.length, 1);
  assert.equal(pendingStage(d, events), "revisao");
  assert.notEqual(d.responsible.name, d.participants[0].person.name);
  assert.equal(personReady(d.participants[0].person), true);
  assert.equal(
    personReady({ ...d.participants[0].person, cpf: "12345678900" }),
    false,
  );
});
test("group of three has explicit independent race assignments", () => {
  let d = resizeParticipants(initialDraft(), 3);
  d = toggleSelection(toggleSelection(d, rio), primavera);
  assert.ok(d.participants.every((p) => p.items.length === 0));
  d = assignRace(d, "p1", rio);
  d = assignRace(d, "p2", rio);
  d = assignRace(d, "p3", rio);
  d = assignRace(d, "p3", primavera);
  assert.deepEqual(
    d.participants.map((p) => p.items.length),
    [1, 1, 2],
  );
  assert.equal(registrationCount(d.participants), 4);
  d.participants[0].items[0].distance = "5 km";
  assert.equal(d.participants[1].items[0].distance, "");
  d = assignRace(d, "p3", primavera);
  d = assignRace(d, "p3", primavera);
  assert.equal(
    d.participants[2].items.filter((i) => i.raceId === primavera.id).length,
    1,
  );
});
test("central maximum, quantity changes and removal preserve remaining identity", () => {
  let d = resizeParticipants(initialDraft(), previewConfig.maxParticipants);
  assert.equal(d.participants.length, 20);
  assert.equal(new Set(d.participants.map((p) => p.person.cpf)).size, 20);
  for (const n of [0, 21, 2.5, NaN]) assert.equal(resizeParticipants(d, n), d);
  d.participants[0].person.name = "Nome fictício preservado";
  d = resizeParticipants(d, 3);
  d = removeParticipant(d, "p2");
  assert.equal(d.participants.length, 2);
  d = resizeParticipants(d, 3);
  assert.equal(d.participants[0].person.name, "Nome fictício preservado");
  assert.equal(new Set(d.participants.map((p) => p.id)).size, 3);
  assert.equal(d.participants[2].items.length, 0);
  assert.equal(removeParticipant(initialDraft(), "p1").participants.length, 1);
});
test("global race removal affects only that race across participants", () => {
  const d = completeDraft(3);
  const next = toggleSelection(d, rio);
  assert.ok(
    next.participants.every((p) => p.items.every((i) => i.raceId !== rio.id)),
  );
  assert.equal(next.participants[0].items.length, 2);
  assert.deepEqual(next.participants[0].person, d.participants[0].person);
});
test("mode change resets only its registration and preserves other people", () => {
  const d = completeDraft(2);
  const before = globalThis.structuredClone(d.participants[1]);
  const changed = changeSelection(
    d.participants[0].items[0],
    { modality: "appai" },
    rio,
  );
  assert.deepEqual(changed.documents, {});
  assert.equal(changed.acceptedConditions, undefined);
  assert.ok(conditionsReady(d.acceptedConditions, rio));
  assert.equal(changed.distance, "5 km");
  assert.deepEqual(d.participants[1], before);
});
test("document scenarios require authorization or new examples scoped to person", () => {
  let d = resizeParticipants(initialDraft(), 2);
  assert.deepEqual(d.participants[0].existingDocumentIds, ["identity"]);
  assert.equal(d.participants[0].reuseAuthorized, false);
  assert.deepEqual(d.participants[0].documents, {});
  assert.deepEqual(d.participants[1].existingDocumentIds, []);
  d = completeDraft(2);
  d.participants[1].documents = {};
  assert.equal(pendingStage(d, events), "documentos");
  assert.equal(d.participants[0].documents.identity, "demo");
});
test("guards catch unfinished persons, duplicate identity, specific documents and terms", () => {
  const d = completeDraft(3);
  assert.equal(pendingStage(d, events), "revisao");
  assert.equal(pendingStage({ ...d, prepared: false }, events), "pedido");
  assert.equal(
    pendingStage({ ...d, responsible: { ...d.responsible, name: "" } }, events),
    "responsavel",
  );
  let x = globalThis.structuredClone(d);
  x.participants[1].person.cpf = x.participants[0].person.cpf;
  assert.equal(pendingStage(x, events), "participantes");
  x = globalThis.structuredClone(d);
  x.participants[2].items = [];
  assert.equal(pendingStage(x, events), "participantes");
  x = globalThis.structuredClone(d);
  x.participants[0].items.push(x.participants[0].items[0]);
  assert.equal(pendingStage(x, events), "participantes");
  x = globalThis.structuredClone(d);
  x.participants[1].items[0].documents = {};
  assert.equal(pendingStage(x, events), "documentos");
  x = globalThis.structuredClone(d);
  x.acceptedConditions[rio.id] = [];
  assert.equal(pendingStage(x, events), "condicoes");
});
test("totals sum all participants in cents with different payment methods", () => {
  const d = completeDraft(3);
  const items = d.participants.flatMap((p) => p.items);
  assert.equal(totalPrice(items, events, "Pix").known, 12400);
  assert.equal(totalPrice(items, events, "Cartão").known, 14400);
  assert.equal(totalPrice(d.participants[0].items, events, "Pix").known, 7200);
  assert.equal(
    itemPrice({ ...items[1], kit: "numero" }, primavera, "Pix"),
    2000,
  );
  assert.equal(selectionEstimate([rio, primavera], "Pix").known, 4000);
  const noPrice = {
    ...rio,
    modalities: rio.modalities.map((m) => ({
      ...m,
      prices: { pix: null, card: null },
      shirtPrices: undefined,
      numberPrices: undefined,
    })),
  };
  assert.equal(totalPrice([items[0]], [noPrice], "Pix").pending, 1);
});
test("final simulation creates deeply frozen snapshot and every edit path stays locked", () => {
  const d = completeDraft(3);
  const final = finalizeOrder(d, events);
  assert.equal(final.order.id, "DEMO-PEDIDO-001");
  assert.equal(final.order.participants.length, 3);
  assert.ok(Object.isFrozen(final.order.participants[0].items[0].documents));
  d.participants[0].person.name = "Changed draft";
  assert.notEqual(
    final.order.participants[0].person.name,
    d.participants[0].person.name,
  );
  assert.throws(() => {
    final.order.participants[0].person.name = "Edit";
  }, TypeError);
  assert.equal(
    editableUpdate(final, () => initialDraft()),
    final,
  );
  assert.equal(toggleSelection(final, rio), final);
  assert.equal(assignRace(final, "p1", rio), final);
  assert.equal(resizeParticipants(final, 1), final);
  assert.equal(removeParticipant(final, "p1"), final);
  assert.equal(finalizeOrder(final, events), final);
  assert.equal(finalizeOrder(initialDraft(), events).order, undefined);
  assert.equal(initialDraft().order, undefined);
});
test("tracking has one unique voucher per participant-race with independent statuses", () => {
  const final = finalizeOrder(completeDraft(3), events);
  const waiting = trackingItems(final.order);
  assert.equal(waiting.length, 5);
  assert.equal(new Set(waiting.map((i) => i.voucherId)).size, 5);
  assert.equal(waiting[0].voucherId, voucherId("p1", rio.id));
  assert.match(waiting[0].bib, /001/);
  assert.equal(waiting[1].bib, null);
  const withdrawn = trackingItems(final.order, "withdrawn");
  assert.match(withdrawn[0].withdrawal, /Retirado/);
  assert.match(withdrawn[1].withdrawal, /Aguardando/);
  assert.equal(waiting[0].payment, withdrawn[0].payment);
  assert.match(waiting[0].payment, /sem confirmação bancária/);
});
test("groups stay unavailable without confirmed safe configuration", () => {
  assert.equal(groupUrl(rio), null);
  for (const url of [
    "javascript:alert(1)",
    "http://chat.whatsapp.com/demo",
    "https://evil.invalid/",
    "https://whatsapp.com.evil.invalid/",
  ])
    assert.equal(groupUrl({ ...rio, whatsappUrl: url }), null);
  assert.equal(
    groupUrl({ ...rio, whatsappUrl: "https://chat.whatsapp.com/test-only" }),
    "https://chat.whatsapp.com/test-only",
  );
});
test("availability checks explicit status and exact deadline", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  assert.equal(isAvailable(rio, now), true);
  assert.equal(isAvailable(closed, now), false);
  assert.equal(isAvailable({ ...rio, status: "unavailable" }, now), false);
  assert.equal(isAvailable(rio, Date.parse(rio.closesAt)), false);
  assert.equal(
    toggleSelection(initialDraft(), closed).selectedRaceIds.length,
    0,
  );
});
test("modalities, distances, kit types, sizes and pickup are per race", () => {
  const a = configured(rio),
    b = configured(cidade, "appai");
  assert.equal(optionsReady(a, rio), true);
  assert.equal(optionsReady({ ...a, distance: "42 km" }, rio), false);
  assert.equal(optionsReady({ ...a, kitType: "" }, rio), false);
  assert.equal(optionsReady({ ...a, pickup: "" }, rio), false);
  assert.equal(optionsReady({ ...b, modality: "oficial" }, cidade), false);
  assert.equal(optionsReady({ ...b, size: "PP" }, cidade), false);
  assert.equal(optionsReady({ ...b, kit: "numero", size: "" }, cidade), true);
  assert.equal(
    optionsReady({ ...b, kit: "camiseta", size: "" }, cidade),
    false,
  );
});
test("documents depend on race and modality; only personal documents are reusable", () => {
  const a = configured(rio),
    b = configured(primavera, "appai"),
    c = configured(cidade, "appai");
  assert.equal(documentsReady(b, primavera, { identity: "demo" }), true);
  assert.equal(
    documentsReady({ ...a, documents: { registration: "demo" } }, rio, {
      identity: "demo",
    }),
    false,
  );
  assert.equal(
    documentsReady(
      { ...a, documents: { registration: "demo", authorization: "demo" } },
      rio,
      { identity: "demo" },
    ),
    true,
  );
  assert.equal(
    documentsReady(c, cidade, {
      identity: "demo",
      authorization: "other-race",
    }),
    false,
  );
  assert.equal(requiredDocuments(a, rio).length, 3);
  assert.equal(requiredDocuments(b, primavera).length, 1);
});
test("one acceptance per race and condition covers the whole group", () => {
  let d = completeDraft(3);
  const expected = events
    .filter((r) => d.selectedRaceIds.includes(r.id))
    .reduce((n, r) => n + r.conditions.length, 0);
  assert.equal(Object.values(d.acceptedConditions).flat().length, expected);
  assert.equal(conditionsReady(d.acceptedConditions, rio), true);
  assert.ok(
    d.acceptedConditions[rio.id].includes(conditionVersion(rio.conditions[0])),
  );
  assert.equal(
    conditionsReady(
      { [primavera.id]: d.acceptedConditions[primavera.id] },
      rio,
    ),
    false,
  );
  const before = globalThis.structuredClone(d.acceptedConditions);
  d = resizeParticipants(d, 4);
  d = assignRace(d, d.participants[3].id, rio);
  assert.deepEqual(d.acceptedConditions, before);
  d = acceptCondition(d, rio, rio.conditions[0].id, true);
  assert.deepEqual(d.acceptedConditions, before);
});
test("modified version or condition content invalidates old acceptance", () => {
  const d = completeDraft(3);
  for (const change of [
    { id: "new-version", text: rio.conditions[0].text },
    { ...rio.conditions[0], text: "Minuta alterada" },
  ]) {
    const race = { ...rio, conditions: [change, ...rio.conditions.slice(1)] };
    assert.equal(conditionsReady(d.acceptedConditions, race), false);
    const catalog = events.map((r) => (r.id === rio.id ? race : r));
    assert.equal(pendingStage(d, catalog), "condicoes");
    assert.equal(finalizeOrder(d, catalog).order, undefined);
  }
  assert.equal(conditionsReady({}, { ...rio, conditions: [] }), true);
});
test("removal and reinsertion clear only that race's general acceptances", () => {
  const d = completeDraft(3);
  const removed = toggleSelection(d, rio);
  assert.equal(removed.acceptedConditions[rio.id], undefined);
  assert.deepEqual(
    removed.acceptedConditions[primavera.id],
    d.acceptedConditions[primavera.id],
  );
  const again = toggleSelection(removed, rio);
  assert.equal(conditionsReady(again.acceptedConditions, rio), false);
  assert.equal(again.participants[0].documents.identity, "demo");
});
test("new selection after finalization creates a clean draft without changing snapshot", () => {
  const final = finalizeOrder(completeDraft(3), events);
  const snapshot = final.order;
  assert.equal(selectForNewOrder(final, closed), final);
  let next = selectForNewOrder(final, rio);
  assert.equal(next.order, undefined);
  assert.deepEqual(next.selectedRaceIds, [rio.id]);
  assert.deepEqual(next.acceptedConditions, {});
  assert.equal(next.participants.length, 1);
  assert.deepEqual(next.participants[0].documents, {});
  assert.equal(next.participants[0].reuseAuthorized, false);
  assert.equal(next.participants[0].items.length, 0);
  next = selectForNewOrder(next, primavera);
  assert.deepEqual(next.selectedRaceIds, [rio.id, primavera.id]);
  assert.equal(snapshot.participants.length, 3);
  assert.ok(Object.isFrozen(snapshot.acceptedConditions));
  assert.deepEqual(final.order, snapshot);
});
test("directed validation identifies first field inside any participant panel", () => {
  const d = completeDraft(3);
  assert.equal(firstIssue("participantes", d, events), null);
  d.participants[1].items[0].distance = "";
  assert.deepEqual(firstIssue("participantes", d, events), {
    target: controlId("distance", "p2", rio.id),
    message: `Selecione a distância para ${rio.name}.`,
    participantId: "p2",
  });
  d.participants[0].person.name = "";
  assert.equal(
    firstIssue("participantes", d, events).target,
    controlId("name", "p1"),
  );
  d.participants[0].person.name = "Pessoa fictícia";
  d.participants[1].items = [];
  assert.equal(
    firstIssue("participantes", d, events).target,
    controlId("races", "p2"),
  );
});
test("conditional fields, document counts and race conditions have specific targets", () => {
  const d = completeDraft(3);
  d.participants[1].items[0].size = "";
  assert.equal(
    firstIssue("participantes", d, events).target,
    controlId("size", "p2", rio.id),
  );
  d.participants[1].items[0].kit = "numero";
  assert.equal(firstIssue("participantes", d, events), null);
  d.participants[1].documents = {};
  d.participants[1].items[0].documents = {};
  assert.equal(missingDocuments(d.participants[1], events), 2);
  assert.equal(
    firstIssue("documentos", d, events).target,
    controlId("document", "p2", undefined, "identity"),
  );
  d.acceptedConditions[rio.id] = [];
  assert.equal(
    firstIssue("condicoes", d, events).target,
    controlId("condition", undefined, rio.id, rio.conditions[0].id),
  );
});

test("file validation rejects unsupported and oversized files", () => {
  assert.ok(fileError({ type: "text/html", size: 10 }));
  assert.ok(fileError({ type: "application/pdf", size: 6 * 1024 * 1024 }));
  assert.equal(fileError({ type: "image/png", size: 1024 }), "");
});

test("individual PDF contains correct person-race and valid cross-reference offsets", async () => {
  const { createVoucherPdf, voucherLines } =
    await import("../src/state/voucherPdf.ts");
  const d = finalizeOrder(completeDraft(3), events);
  const p = d.order.participants[1];
  const lines = voucherLines(d.order, p, p.items[0], rio);
  assert.ok(lines.includes("Identificação fictícia: DEMO-CPF-002"));
  assert.ok(lines.includes("Voucher: DEMO-VOUCHER-p2-rio"));
  assert.ok(!lines.some((l) => l.includes("DEMO-CPF-001")));
  assert.ok(lines.includes("DEMONSTRAÇÃO — SEM VALIDADE"));
  const pdf = createVoucherPdf(
    lines,
    new Uint8Array([255, 216, 255, 217]),
    100,
    40,
  );
  const text = Buffer.from(pdf).toString("latin1");
  assert.ok(text.startsWith("%PDF-1.4"));
  assert.match(text, /\/Logo 6 0 R/);
  assert.match(text, /DEMONSTRA/);
  const xref = Number(text.match(/startxref\n(\d+)/)[1]);
  assert.equal(text.slice(xref, xref + 4), "xref");
  const rows = text.slice(xref).split("\n").slice(3, 10);
  rows.forEach((row, index) =>
    assert.equal(
      text.slice(Number(row.slice(0, 10))).startsWith(`${index + 1} 0 obj`),
      true,
    ),
  );
});

test("different conditions of the same race need separate versioned consent", () => {
  const race = {
    ...rio,
    conditions: [
      ...rio.conditions,
      {
        id: "qa-extra-v1",
        text: "Condição fictícia adicional somente para teste",
      },
    ],
  };
  let d = toggleSelection(initialDraft(), race);
  d = acceptCondition(d, race, race.conditions[0].id, true);
  assert.equal(conditionsReady(d.acceptedConditions, race), false);
  assert.equal(
    firstIssue("condicoes", d, [race]).target,
    controlId("condition", undefined, race.id, "qa-extra-v1"),
  );
  d = acceptCondition(d, race, "qa-extra-v1", true);
  assert.equal(conditionsReady(d.acceptedConditions, race), true);
  assert.equal(d.acceptedConditions[race.id].length, 2);
  d = acceptCondition(d, race, race.conditions[0].id, false);
  assert.equal(conditionsReady(d.acceptedConditions, race), false);
});
