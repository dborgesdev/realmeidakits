import { personError, validCpf, validPhone } from "./identityRules.ts";
import type {
  Draft,
  Person,
  Race,
  RaceSelection,
  Participant,
  Responsible,
} from "../types/domain";
import { isAvailable } from "./selectionRules.ts";
import { conditionsReady } from "./conditionRules.ts";
export { conditionsReady } from "./conditionRules.ts";
import { previewConfig } from "../config/preview.ts";
import { raceOptions } from "./catalogRules.ts";
export const stages = [
  "pedido",
  "responsavel",
  "participantes",
  "documentos",
  "condicoes",
  "revisao",
  "pagamento",
];
export const stageLabels = [
  "Pedido",
  "Responsável",
  "Participantes",
  "Documentos",
  "Condições",
  "Revisão",
  "Pagamento",
];
export function optionsReady(item: RaceSelection, race: Race) {
  const mode = race.modalities.find((m) => m.id === item.modality);
  const options = raceOptions(race, item.modality);
  return Boolean(
    mode &&
    options.distances.includes(item.distance) &&
    (!options.pickupLocations.length ||
      options.pickupLocations.includes(item.pickup)) &&
    (item.modality !== "oficial" ||
      !options.kitTypes.length ||
      options.kitTypes.includes(item.kitType)) &&
    (item.modality !== "appai" ||
      (item.kit === "numero" && mode.numberEnabled !== false) ||
      (item.kit === "camiseta" &&
        mode.shirtEnabled !== false &&
        mode.sizes.includes(item.size))),
  );
}
export function personReady(person: Person) {
  return !personError(person);
}
export function configuredDocuments(item: RaceSelection, race: Race) {
  return race.modalities.find((m) => m.id === item.modality)?.documents || [];
}
export function requiredDocuments(item: RaceSelection, race: Race) {
  return (
    race.modalities
      .find((m) => m.id === item.modality)
      ?.documents.filter(
        (d) => d.required !== false && d.requiresUpload !== false,
      ) || []
  );
}
export function fieldsReady(item: RaceSelection, race?: Race) {
  const mode = race?.modalities.find((m) => m.id === item.modality);
  if (item.modality === "appai" && mode?.requireMembership === false)
    return true;
  if (item.modality === "oficial" && mode?.requireRegistration === false)
    return true;
  const value = item.modality === "appai" ? item.membership : item.registration;
  return value.trim().length > 0;
}
export function documentsReady(
  item: RaceSelection,
  race: Race,
  shared: Record<string, string>,
) {
  return requiredDocuments(item, race).every((doc) =>
    Boolean(
      item.documents[doc.id] || (doc.scope === "personal" && shared[doc.id]),
    ),
  );
}
export function responsibleReady(person: Responsible) {
  return (
    person.name.trim().length >= 3 &&
    person.name.length <= 80 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) &&
    validPhone(person.phone) &&
    validCpf(person.identifier)
  );
}
export function participantReady(
  p: Participant,
  catalog: Race[],
  selected: string[],
) {
  return (
    personReady(p.person) &&
    p.items.length > 0 &&
    new Set(p.items.map((i) => i.raceId)).size === p.items.length &&
    p.items.every((i) => {
      const race = catalog.find((r) => r.id === i.raceId);
      return (
        race &&
        selected.includes(i.raceId) &&
        isAvailable(race) &&
        optionsReady(i, race) &&
        fieldsReady(i, race)
      );
    })
  );
}
export function participantDocumentsReady(p: Participant, catalog: Race[]) {
  return p.items.every((i) => {
    const race = catalog.find((r) => r.id === i.raceId);
    return !!race && documentsReady(i, race, p.documents);
  });
}
export function pendingStage(
  draft: Draft,
  catalog: Race[],
  limit: number = previewConfig.maxParticipants,
): string {
  if (
    !draft.prepared ||
    draft.participants.length < 1 ||
    draft.participants.length > limit ||
    !draft.selectedRaceIds.length
  )
    return "pedido";
  if (!responsibleReady(draft.responsible)) return "responsavel";
  if (
    new Set(draft.participants.map((p) => p.person.cpf.replace(/\D/g, "")))
      .size !== draft.participants.length ||
    !draft.participants.every((p) =>
      participantReady(p, catalog, draft.selectedRaceIds),
    )
  )
    return "participantes";
  if (!draft.participants.every((p) => participantDocumentsReady(p, catalog)))
    return "documentos";
  if (
    !draft.selectedRaceIds.every((id) => {
      const race = catalog.find((r) => r.id === id);
      return !!race && conditionsReady(draft.acceptedConditions, race);
    })
  )
    return "condicoes";
  return "revisao";
}
