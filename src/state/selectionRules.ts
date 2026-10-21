import type { Draft, Modality, Race, RaceSelection } from "../types/domain";
export function isAvailable(race: Race, now = Date.now()) {
  return (
    race.status === "open" &&
    (!race.closesAt || Date.parse(race.closesAt) > now)
  );
}
export function availabilityLabel(race: Race, now = Date.now()) {
  return isAvailable(race, now)
    ? "Solicitações abertas"
    : race.status === "unavailable"
      ? "Indisponível"
      : "Solicitações encerradas";
}
export function makeSelection(race: Race, preferred?: Modality): RaceSelection {
  const modality =
    race.modalities.find((m) => m.id === preferred)?.id ||
    race.modalities[0].id;
  return {
    raceId: race.id,
    modality,
    distance: "",
    kitType: "",
    kit: "camiseta",
    size: "",
    membership: "DEMO-101",
    registration: "DEMO-INSCRICAO-001",
    pickup: race.pickupLocations.length === 1 ? race.pickupLocations[0] : "",
    documents: {},
    acceptedConditions: [],
  };
}
export function toggleSelection(
  draft: Draft,
  race: Race,
  preferred?: Modality,
): Draft {
  if (draft.items.some((i) => i.raceId === race.id))
    return {
      ...draft,
      order: undefined,
      items: draft.items.filter((i) => i.raceId !== race.id),
    };
  if (!isAvailable(race)) return draft;
  return {
    ...draft,
    order: undefined,
    items: [...draft.items, makeSelection(race, preferred)],
  };
}
export function changeSelection(
  item: RaceSelection,
  patch: Partial<RaceSelection>,
  race: Race,
): RaceSelection {
  const next = { ...item, ...patch };
  if (patch.modality && patch.modality !== item.modality) {
    return {
      ...makeSelection(race, patch.modality),
      distance: race.distances.includes(item.distance) ? item.distance : "",
      pickup: race.pickupLocations.includes(item.pickup) ? item.pickup : "",
    };
  }
  return next;
}
