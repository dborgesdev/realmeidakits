import type { Race, RaceSelection } from "../types/domain";
export function itemBasePrice(item: RaceSelection, race: Race): number | null {
  const mode = race.modalities.find((entry) => entry.id === item.modality);
  if (!mode) return null;
  if (!race.prices) return race.priceCents;
  if (item.modality === "oficial") return race.prices.official;
  return item.kit === "camiseta"
    ? mode.shirtEnabled
      ? race.prices.shirt
      : null
    : mode.numberEnabled
      ? race.prices.number
      : null;
}
export function kitAdditional(item: RaceSelection, race: Race) {
  return item.modality === "oficial"
    ? (race.modalities.find((mode) => mode.id === "oficial")?.kitAdditions?.[
        item.kitType
      ] ?? 0)
    : 0;
}
export function itemPrice(item: RaceSelection, race: Race): number | null {
  const base = itemBasePrice(item, race);
  return base === null ? null : base + kitAdditional(item, race);
}
export function totalPrice(items: RaceSelection[], catalog: Race[]) {
  let known = 0,
    pending = 0;
  for (const item of items) {
    const race = catalog.find((r) => r.id === item.raceId);
    const amount = race ? itemPrice(item, race) : null;
    if (amount === null) pending++;
    else known += amount;
  }
  return { known, pending };
}
export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
export function modalityLabel(item: RaceSelection) {
  return item.modality === "oficial"
    ? "Kit Oficial"
    : item.kit === "numero"
      ? "APPAI · Somente número de peito"
      : `APPAI · Camiseta ${item.size || "a escolher"} com número de peito`;
}

export function selectionEstimate(races: Race[]) {
  return races.reduce(
    (total, race) => ({
      known: total.known + (race.priceCents ?? 0),
      pending: total.pending + (race.priceCents === null ? 1 : 0),
    }),
    { known: 0, pending: 0 },
  );
}
