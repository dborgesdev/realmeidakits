import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { URL } from "node:url";
const { Response, AbortController, structuredClone } = globalThis;
import { catalogConfig } from "../src/config/catalog.ts";
import { normalizeRace, normalizePage } from "../src/data/normalizeRace.ts";
import {
  loadWordpressRaces,
  loadWordpressRace,
} from "../src/data/wordpressClient.ts";
import { makeSelection, isAvailable } from "../src/state/selectionRules.ts";
import { itemPrice } from "../src/state/pricing.ts";
import {
  optionsReady,
  fieldsReady,
  requiredDocuments,
} from "../src/state/requestRules.ts";
import { conditionVersion } from "../src/state/conditionRules.ts";
const fixture = JSON.parse(
  readFileSync(
    new URL("./fixtures/wordpress-race.json", import.meta.url),
    "utf8",
  ),
);
test("WordPress is the only default with the known public API, without mode flags", () => {
  assert.deepEqual(catalogConfig(), {
    source: "wordpress",
    apiUrl: "/app/wp-json/re-almeida/v1",
  });
  const context = readFileSync(
    new URL("../src/state/CatalogContext.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(context, /demoEvents|data\/events|VITE_DATA_SOURCE/);
});
test("normalizer consumes actual WordPress projection without fictitious fallback values", () => {
  const race = normalizeRace(fixture);
  assert.equal(race.source, "wordpress");
  assert.equal(race.image, "");
  assert.equal(race.priceCents, null);
  assert.equal(race.modalities[1].numberEnabled, true);
  assert.equal(race.modalities[1].shirtEnabled, false);
  assert.equal(makeSelection(race, "appai").kit, "numero");
  assert.equal(fieldsReady(makeSelection(race), race), true);
  assert.equal(race.conditions[0].version, fixture.conditions[0].version);
});
test("invalid nested API data, negative money and duplicate identities are rejected", () => {
  for (const patch of [
    { modalities: [] },
    { image: { url: "javascript:alert(1)", width: 1, height: 1, alt: "" } },
    { configurationError: true, modalities: undefined },
    { raceDate: "2026-02-30" },
    { status: "fake" },
    { modalities: [fixture.modalities[0], fixture.modalities[0]] },
  ])
    assert.throws(() => normalizeRace({ ...fixture, ...patch }));
  const data = structuredClone(fixture);
  data.priceCents = -1;
  assert.throws(() => normalizeRace(data));
  assert.throws(() =>
    normalizePage({ data: [], page: 1, totalPages: 0, total: 1 }),
  );
});
test("modality options do not change the race price", () => {
  const race = normalizeRace(fixture);
  race.modalities[0].distances = ["10 km"];
  race.modalities[0].kitTypes = ["Completo"];
  race.priceCents = 1234;
  const item = {
    ...makeSelection(race, "oficial"),
    distance: "10 km",
    kitType: "Completo",
  };
  assert.equal(optionsReady(item, race), true);
  assert.equal(
    optionsReady({ ...item, distance: race.modalities[1].distances[0] }, race),
    false,
  );
  assert.equal(itemPrice(item, race), 1234);
  assert.equal(
    itemPrice({ ...item, modality: "appai", kit: "numero" }, race),
    1234,
  );
  race.modalities[0].documents.push({
    id: "optional-demo",
    label: "DEMONSTRAÇÃO opcional",
    scope: "race",
    required: false,
  });
  assert.equal(
    requiredDocuments(item, race).some((d) => d.id === "optional-demo"),
    false,
  );
});
test("opening and closing boundaries plus explicit condition versions are respected", () => {
  const race = {
    ...normalizeRace(fixture),
    status: "open",
    opensAt: "2099-01-01T10:00:00-03:00",
    closesAt: "2099-01-01T11:00:00-03:00",
  };
  assert.equal(isAvailable(race, Date.parse(race.opensAt) - 1), false);
  assert.equal(isAvailable(race, Date.parse(race.opensAt)), true);
  assert.equal(isAvailable(race, Date.parse(race.closesAt)), false);
  assert.notEqual(
    conditionVersion({ id: "demo", text: "DEMONSTRAÇÃO", version: 1 }),
    conditionVersion({ id: "demo", text: "DEMONSTRAÇÃO", version: 2 }),
  );
});
test("HTTP client paginates, omits credentials, and has no demo fallback", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const page = Number(new URL(url).searchParams.get("page"));
    return Response.json({
      data: [{ ...fixture, id: String(page), slug: `demonstracao-${page}` }],
      page,
      totalPages: 2,
      total: 2,
    });
  });
  const result = await loadWordpressRaces(
    "https://example.invalid/wp-json/re-almeida/v1",
  );
  assert.equal(result.length, 2);
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every((c) => c.options.credentials === "omit" && c.options.signal),
  );
  globalThis.fetch.mock.mockImplementation(
    async () => new Response("", { status: 503 }),
  );
  await assert.rejects(
    loadWordpressRaces("https://example.invalid"),
    /indisponível/,
  );
  globalThis.fetch.mock.mockImplementation(async () => {
    throw new TypeError("Network");
  });
  await assert.rejects(
    loadWordpressRaces("https://example.invalid"),
    /conexão/,
  );
});
test("empty catalog, malformed payload, not-found detail and cancellation stay explicit", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ data: [], page: 1, totalPages: 0, total: 0 }),
  );
  assert.deepEqual(await loadWordpressRaces("https://example.invalid"), []);
  globalThis.fetch.mock.mockImplementation(async () =>
    Response.json({ data: [{ bad: true }], page: 1, totalPages: 1, total: 1 }),
  );
  await assert.rejects(
    loadWordpressRaces("https://example.invalid"),
    /inválidos/,
  );
  globalThis.fetch.mock.mockImplementation(
    async () => new Response("", { status: 404 }),
  );
  await assert.rejects(
    loadWordpressRace("https://example.invalid", "sem-corrida"),
    /não encontrada/,
  );
  const controller = new AbortController();
  controller.abort();
  globalThis.fetch.mock.mockImplementation(async () => {
    throw controller.signal.reason;
  });
  await assert.rejects(
    loadWordpressRaces("https://example.invalid", controller.signal),
    { name: "AbortError" },
  );
});

test("the relative API accepts local media and WordPress models from the browser origin", async (t) => {
  const previousLocation = Object.getOwnPropertyDescriptor(
    globalThis,
    "location",
  );
  const origin = "http://127.0.0.1:5173";
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { origin },
  });
  t.after(() => {
    if (previousLocation)
      Object.defineProperty(globalThis, "location", previousLocation);
    else delete globalThis.location;
  });
  const race = structuredClone(fixture);
  race.image = {
    url: origin + "/app/wp-content/uploads/qa.jpg",
    width: 1,
    height: 1,
    alt: "",
  };
  const doc = race.modalities[0].documents[0];
  doc.template = {
    url:
      origin +
      "/app/wp-admin/admin-post.php?action=rak_public_model&attachment=10",
    name: "demonstracao-modelo.pdf",
    mime: "application/pdf",
  };
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(new URL(url).origin, origin);
    return Response.json({ data: [race], page: 1, totalPages: 1, total: 1 });
  });
  const [result] = await loadWordpressRaces(catalogConfig().apiUrl);
  assert.equal(result.image, race.image.url);
  assert.equal(
    result.modalities[0].documents[0].template.url,
    doc.template.url,
  );
});
