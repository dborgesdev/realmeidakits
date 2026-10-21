import { initialDraft } from "../data/demo.ts";
import type { Draft, Modality, Race, RaceSelection } from "../types/domain";
export function isAvailable(race: Race, now = Date.now()) {
  return (
    race.status === "open" &&
    (!race.closesAt || Date.parse(race.closesAt) > now)
  );
}
export function availabilityLabel(race: Race, now = Date.now()) {
  return isAvailable(race, now)
    ? "Inscrições abertas"
    : race.status === "unavailable"
      ? "Indisponível"
      : "Inscrições encerradas";
}
export function makeSelection(race: Race, preferred?: Modality): RaceSelection {
  return {
    raceId: race.id,
    modality:
      race.modalities.find((m) => m.id === preferred)?.id ||
      race.modalities[0].id,
    distance: "",
    kitType: "",
    kit: "camiseta",
    size: "",
    membership: "DEMO-101",
    registration: "DEMO-INSCRICAO-001",
    pickup: race.pickupLocations.length === 1 ? race.pickupLocations[0] : "",
    documents: {},
  };
}
export function toggleSelection(draft: Draft, race: Race): Draft {
  if (draft.order) return draft;
  if (draft.selectedRaceIds.includes(race.id))
    return {
      ...draft,
      acceptedConditions: Object.fromEntries(
        Object.entries(draft.acceptedConditions).filter(
          ([id]) => id !== race.id,
        ),
      ),
      selectedRaceIds: draft.selectedRaceIds.filter((id) => id !== race.id),
      participants: draft.participants.map((p) => ({
        ...p,
        items: p.items.filter((i) => i.raceId !== race.id),
      })),
    };
  return isAvailable(race)
    ? { ...draft, selectedRaceIds: [...draft.selectedRaceIds, race.id] }
    : draft;
}
export function changeSelection(
  item: RaceSelection,
  patch: Partial<RaceSelection>,
  race: Race,
): RaceSelection {
  if (patch.modality && patch.modality !== item.modality)
    return {
      ...makeSelection(race, patch.modality),
      distance: race.distances.includes(item.distance) ? item.distance : "",
      pickup: race.pickupLocations.includes(item.pickup) ? item.pickup : "",
    };
  return { ...item, ...patch };
}

export function selectForNewOrder(draft: Draft, race: Race): Draft {
  if (draft.order) {
    return isAvailable(race) ? toggleSelection(initialDraft(), race) : draft;
  }
  return toggleSelection(draft, race);
}

// Entry shortcuts affect future assignments only. A completed order starts clean.
export function preferModality(draft: Draft, modality: Modality): Draft {
  return {
    ...(draft.order ? initialDraft() : draft),
    preferredModality: modality,
  };
}
