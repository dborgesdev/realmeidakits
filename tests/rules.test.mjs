import { test } from "node:test";
import assert from "node:assert/strict";
import { events as fixtures } from "../src/data/events.ts";
import { initialDraft } from "../src/data/demo.ts";
import {
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
function completeDraft() {
  const d = initialDraft();
  d.identified = true;
  d.items = [
    configured(rio),
    configured(primavera, "appai"),
    { ...configured(cidade, "appai"), kit: "numero", size: "" },
  ];
  d.sharedDocuments = { identity: "demo" };
  d.items = d.items.map((i) => {
    const race = events.find((r) => r.id === i.raceId);
    return {
      ...i,
      documents: Object.fromEntries(
        requiredDocuments(i, race)
          .filter((doc) => doc.scope === "race")
          .map((doc) => [doc.id, "demo"]),
      ),
      acceptedConditions: race.conditions.map((c) => c.id),
    };
  });
  return d;
}
test("selecting, toggling and removing keeps one item per race and personal data", () => {
  let d = initialDraft();
  d = toggleSelection(d, rio);
  assert.equal(d.items.length, 1);
  d = toggleSelection(d, primavera);
  d = toggleSelection(d, cidade);
  assert.equal(d.items.length, 3);
  d.person.name = "Nome fictício alterado";
  d = toggleSelection(d, primavera);
  assert.deepEqual(
    d.items.map((i) => i.raceId),
    [rio.id, cidade.id],
  );
  assert.equal(d.person.name, "Nome fictício alterado");
  d = toggleSelection(d, rio);
  assert.equal(d.items.length, 1);
});
test("availability checks explicit status and exact deadline", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  assert.equal(isAvailable(rio, now), true);
  assert.equal(isAvailable(closed, now), false);
  assert.equal(isAvailable({ ...rio, status: "unavailable" }, now), false);
  assert.equal(isAvailable(rio, Date.parse(rio.closesAt)), false);
  assert.equal(toggleSelection(initialDraft(), closed).items.length, 0);
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
test("changing a modality resets specific documents and conditions without altering another race", () => {
  const d = completeDraft();
  const changed = changeSelection(d.items[0], { modality: "appai" }, rio);
  assert.deepEqual(changed.documents, {});
  assert.deepEqual(changed.acceptedConditions, []);
  assert.equal(changed.distance, d.items[0].distance);
  assert.equal(d.items[1].modality, "appai");
  assert.equal(d.items[1].distance, "5 km");
});
test("personal data is validated once with safe fictitious identifiers", () => {
  const p = initialDraft().person;
  assert.equal(personReady(p), true);
  assert.equal(personReady({ ...p, cpf: "12345678900" }), false);
  assert.equal(personReady({ ...p, name: " " }), false);
  assert.equal(personReady({ ...p, birthDate: "2000-02-30" }), false);
  assert.equal(personReady({ ...p, birthDate: "2999-01-01" }), false);
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
test("terms require the specific race and version", () => {
  const a = configured(rio);
  assert.equal(conditionsReady(a, rio), false);
  assert.equal(
    conditionsReady(
      { ...a, acceptedConditions: primavera.conditions.map((c) => c.id) },
      rio,
    ),
    false,
  );
  assert.equal(
    conditionsReady(
      { ...a, acceptedConditions: rio.conditions.map((c) => c.id) },
      rio,
    ),
    true,
  );
});
test("consolidated totals use cents, payment method and per-item options", () => {
  const d = completeDraft();
  assert.equal(totalPrice(d.items, events, "Pix").known, 7200);
  assert.equal(totalPrice(d.items, events, "Cartão").known, 8400);
  assert.equal(
    itemPrice({ ...d.items[1], kit: "numero" }, primavera, "Pix"),
    2000,
  );
  const catalog = events.map((r) =>
    r.id === rio.id
      ? {
          ...r,
          modalities: r.modalities.map((m) => ({
            ...m,
            prices: { pix: null, card: null },
          })),
        }
      : r,
  );
  assert.equal(totalPrice(d.items, catalog, "Pix").pending, 1);
});
test("route guards block missing identification, documents, terms and duplicates", () => {
  const d = completeDraft();
  assert.equal(pendingStage(d, events), "revisao");
  assert.equal(
    pendingStage({ ...d, identified: false }, events),
    "identificacao",
  );
  assert.equal(
    pendingStage({ ...d, items: [...d.items, d.items[0]] }, events),
    "configuracao",
  );
  assert.equal(
    pendingStage(
      { ...d, items: d.items.map((i) => ({ ...i, documents: {} })) },
      events,
    ),
    "documentos",
  );
  assert.equal(
    pendingStage(
      { ...d, items: d.items.map((i) => ({ ...i, acceptedConditions: [] })) },
      events,
    ),
    "condicoes",
  );
});
test("tracking distinguishes bib, payment, kit and withdrawal independently", () => {
  const d = completeDraft();
  const order = {
    id: "DEMO-PEDIDO-001",
    person: d.person,
    items: d.items,
    sharedDocuments: d.sharedDocuments,
    method: d.method,
  };
  const waiting = trackingItems(order);
  assert.match(waiting[0].bib, /001/);
  assert.equal(waiting[1].bib, null);
  const scenario = trackingItems(order, "withdrawn");
  assert.match(scenario[0].withdrawal, /Retirado/);
  assert.match(scenario[1].withdrawal, /Aguardando/);
  assert.equal(scenario[0].payment, waiting[0].payment);
  assert.notEqual(scenario[0].voucherId, scenario[1].voucherId);
  assert.match(scenario[0].payment, /sem confirmação bancária/);
});
test("selection edits invalidate the illustrative order without duplicating an item", () => {
  const d = completeDraft();
  d.order = {
    id: "DEMO",
    person: d.person,
    items: d.items,
    sharedDocuments: d.sharedDocuments,
    method: d.method,
  };
  const changed = toggleSelection(d, primavera);
  assert.equal(changed.order, undefined);
  assert.equal(changed.items.length, 2);
  assert.equal(d.items.length, 3);
});
test("file validation rejects unsupported and oversized files", () => {
  assert.ok(fileError({ type: "text/html", size: 10 }));
  assert.ok(fileError({ type: "application/pdf", size: 6 * 1024 * 1024 }));
  assert.equal(fileError({ type: "image/png", size: 1024 }), "");
});
