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
  return Boolean(
    mode &&
    race.distances.includes(item.distance) &&
    (!race.pickupLocations.length ||
      race.pickupLocations.includes(item.pickup)) &&
    (item.modality !== "oficial" ||
      !race.kitTypes.length ||
      race.kitTypes.includes(item.kitType)) &&
    (item.modality !== "appai" ||
      item.kit === "numero" ||
      (item.kit === "camiseta" && mode.sizes.includes(item.size))),
  );
}
export function personReady(person: Person) {
  const birth = Date.parse(person.birthDate);
  return (
    person.name.trim().length >= 3 &&
    person.name.length <= 80 &&
    /^DEMO-CPF-[0-9]{3,}$/.test(person.cpf) &&
    /^DEMO-TELEFONE-/.test(person.phone) &&
    person.email.endsWith("@example.invalid") &&
    /^\d{4}-\d{2}-\d{2}$/.test(person.birthDate) &&
    Number.isFinite(birth) &&
    new Date(birth).toISOString().slice(0, 10) === person.birthDate &&
    person.birthDate >= "1900-01-01" &&
    person.birthDate <= new Date().toISOString().slice(0, 10)
  );
}
export function requiredDocuments(item: RaceSelection, race: Race) {
  return race.modalities.find((m) => m.id === item.modality)?.documents || [];
}
export function fieldsReady(item: RaceSelection) {
  return item.modality === "appai"
    ? /^DEMO-\d{3,6}$/.test(item.membership)
    : /^DEMO-[A-Z0-9-]{3,40}$/.test(item.registration);
}
export function documentsReady(
  item: RaceSelection,
  race: Race,
  shared: Record<string, string>,
) {
  return requiredDocuments(item, race).every((doc) =>
    Boolean((doc.scope === "personal" ? shared : item.documents)[doc.id]),
  );
}
export function responsibleReady(person: Responsible) {
  return (
    person.name.trim().length >= 3 &&
    person.name.length <= 80 &&
    person.email === "responsavel@example.invalid" &&
    person.identifier === "DEMO-RESPONSAVEL" &&
    person.phone === "DEMO-TELEFONE-RESP"
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
        fieldsReady(i)
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
export function pendingStage(draft: Draft, catalog: Race[]): string {
  if (
    !draft.prepared ||
    draft.participants.length < 1 ||
    draft.participants.length > previewConfig.maxParticipants ||
    !draft.selectedRaceIds.length
  )
    return "pedido";
  if (!responsibleReady(draft.responsible)) return "responsavel";
  if (
    new Set(draft.participants.map((p) => p.person.cpf)).size !==
      draft.participants.length ||
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
