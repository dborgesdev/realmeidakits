import type { Race } from "../types/domain";
import type { ApiRace, ApiPage } from "./wordpressTypes";
const fail = (): never => {
  throw new Error("A API retornou dados incompletos ou inválidos de corrida.");
};
const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : fail();
const string = (v: unknown): string => (typeof v === "string" ? v : fail());
const nonempty = (v: unknown): string =>
  string(v).trim() ? string(v) : fail();
const array = (v: unknown): unknown[] => (Array.isArray(v) ? v : fail());
const strings = (v: unknown) => array(v).map(nonempty);
const boolean = (v: unknown): boolean => (typeof v === "boolean" ? v : fail());
const integer = (v: unknown): number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : fail();
function image(v: unknown) {
  if (v === null) return "";
  const img = record(v);
  let url: URL;
  try {
    url = new URL(nonempty(img.url));
  } catch {
    return fail();
  }
  if (url.protocol !== "https:" || url.username || url.password) fail();
  integer(img.width);
  integer(img.height);
  string(img.alt);
  return url.href;
}
function prices(v: unknown) {
  const p = record(v);
  return {
    pix: p.pix === null ? null : integer(p.pix),
    card: p.card === null ? null : integer(p.card),
  };
}
function date(v: unknown, day = false) {
  const value = string(v);
  if (
    value &&
    (!Number.isFinite(Date.parse(value)) ||
      (day
        ? !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          new Date(value).toISOString().slice(0, 10) !== value
        : !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(value)))
  )
    fail();
  return value || undefined;
}
function unique<T>(values: T[], key: (v: T) => string) {
  if (new Set(values.map(key)).size !== values.length) fail();
  return values;
}
function normalizeTemplate(
  value: unknown,
  apiUrl?: string,
): { url: string; name: string; mime: "application/pdf" } | null {
  if (value === null || value === undefined) return null;
  const t = record(value);
  let url: URL;
  try {
    url = new URL(nonempty(t.url));
  } catch {
    return fail();
  }
  const local =
    url.protocol === "http:" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !local) ||
    url.username ||
    url.password ||
    url.hash ||
    !url.pathname.endsWith("/wp-admin/admin-post.php") ||
    url.searchParams.get("action") !== "rak_public_model" ||
    !/^[1-9][0-9]*$/.test(url.searchParams.get("attachment") || "") ||
    (apiUrl && url.origin !== new URL(apiUrl).origin) ||
    t.mime !== "application/pdf"
  )
    fail();
  return { url: url.href, name: nonempty(t.name), mime: "application/pdf" };
}
export function normalizeRace(value: unknown, apiUrl?: string): Race {
  const r = record(value);
  if (!["open", "closed", "unavailable"].includes(string(r.status))) fail();
  const modalities = unique(
    array(r.modalities).map((value) => {
      const m = record(value);
      if (m.id !== "oficial" && m.id !== "appai") fail();
      const documents = unique(
        array(m.documents).map((value) => {
          const d = record(value);
          if (d.scope !== "personal" && d.scope !== "race") fail();
          return {
            id: nonempty(d.id),
            label: nonempty(d.label),
            scope: d.scope as "personal" | "race",
            required: boolean(d.required),
            guidance: string(d.guidance),
            requiresUpload:
              d.requiresUpload === undefined ? true : boolean(d.requiresUpload),
            purpose: d.purpose === undefined ? "" : string(d.purpose),
            version: d.version === undefined ? 1 : integer(d.version),
            template: normalizeTemplate(d.template, apiUrl),
          };
        }),
        (d) => d.id,
      );
      const kits = unique(
        array(m.kitTypes).map((value) => {
          const k = record(value);
          return {
            id: nonempty(k.id),
            label: nonempty(k.label),
            prices: prices(k.prices),
          };
        }),
        (k) => k.id,
      );
      const pickups = unique(
        array(m.pickups).map((value) => {
          const p = record(value);
          date(p.at);
          return {
            id: nonempty(p.id),
            label: nonempty(p.label),
            address: string(p.address),
            at: string(p.at),
            guidance: string(p.guidance),
          };
        }),
        (p) => p.id,
      );
      const distances = strings(m.distances);
      if (!distances.length) fail();
      const sizes = strings(m.sizes);
      const shirtEnabled = boolean(m.shirtEnabled),
        numberEnabled = boolean(m.numberEnabled);
      if (
        m.id === "appai" &&
        ((!shirtEnabled && !numberEnabled) || (shirtEnabled && !sizes.length))
      )
        fail();
      return {
        id: m.id as "oficial" | "appai",
        label: nonempty(m.label),
        documents,
        prices: prices(m.prices),
        shirtPrices: prices(m.shirtPrices),
        numberPrices: prices(m.numberPrices),
        sizes,
        distances,
        pickupLocations: pickups.map((p) => p.label),
        pickupDetails: pickups,
        kitTypes: kits.map((k) => k.label),
        kitPrices: Object.fromEntries(kits.map((k) => [k.label, k.prices])),
        shirtEnabled,
        numberEnabled,
        shirtImage: image(m.shirtImage),
        requireRegistration: boolean(m.requireRegistration),
        requireMembership: boolean(m.requireMembership),
      };
    }),
    (m) => m.id,
  );
  if (!modalities.length) fail();
  const conditions = unique(
    array(r.conditions).map((value) => {
      const c = record(value);
      if (!boolean(c.active) || integer(c.version) < 1) fail();
      return {
        id: nonempty(c.id),
        text: nonempty(c.text),
        version: integer(c.version),
      };
    }),
    (c) => c.id,
  );
  const slug = nonempty(r.slug);
  if (!/^[a-z0-9-]+$/.test(slug)) fail();
  return {
    id: nonempty(r.id),
    slug,
    name: nonempty(r.name),
    description: string(r.description),
    image: image(r.image),
    raceDate: date(r.raceDate, true),
    raceTime: string(r.raceTime),
    location: string(r.location),
    opensAt: date(r.opensAt),
    closesAt: date(r.closesAt),
    status: r.status as ApiRace["status"],
    modalities,
    distances: [...new Set(modalities.flatMap((m) => m.distances))],
    kitTypes: [...new Set(modalities.flatMap((m) => m.kitTypes))],
    pickupLocations: [...new Set(modalities.flatMap((m) => m.pickupLocations))],
    conditions,
    guidance: string(r.guidance),
    contact: string(r.contact),
    whatsappUrl: string(r.whatsappUrl),
    source: "wordpress",
  };
}
export function normalizePage(
  value: unknown,
  apiUrl?: string,
): {
  races: Race[];
  page: number;
  totalPages: number;
  total: number;
} {
  const p = record(value);
  if (
    integer(p.page) < 1 ||
    (integer(p.totalPages) === 0 &&
      (integer(p.total) !== 0 || array(p.data).length !== 0))
  )
    fail();
  return {
    races: unique(
      array(p.data).map((race) => normalizeRace(race, apiUrl)),
      (r) => r.id,
    ),
    page: integer(p.page),
    totalPages: integer(p.totalPages),
    total: integer(p.total),
  } satisfies Omit<ApiPage, "data"> & { races: Race[] };
}
