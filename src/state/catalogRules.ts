import type { Modality, Race } from "../types/domain";
export function raceOptions(race: Race, modality: Modality) {
  const mode = race.modalities.find((m) => m.id === modality);
  return {
    distances: mode?.distances ?? race.distances,
    kitTypes: mode?.kitTypes ?? race.kitTypes,
    pickupLocations: mode?.pickupLocations ?? race.pickupLocations,
  };
}
