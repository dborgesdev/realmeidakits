import type { PaymentMethod, Race, RaceSelection } from "../types/domain";
export function itemPrice(
  item: RaceSelection,
  race: Race,
  method: PaymentMethod,
): number | null {
  const mode = race.modalities.find((m) => m.id === item.modality);
  if (!mode) return null;
  const prices =
    item.modality === "appai"
      ? (item.kit === "numero" ? mode.numberPrices : mode.shirtPrices) ||
        mode.prices
      : mode.prices;
  return method === "Pix" ? prices.pix : prices.card;
}
export function totalPrice(
  items: RaceSelection[],
  catalog: Race[],
  method: PaymentMethod,
) {
  let known = 0,
    pending = 0;
  for (const item of items) {
    const race = catalog.find((r) => r.id === item.raceId);
    const amount = race ? itemPrice(item, race, method) : null;
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
