import type { Draft, Person, Race, RaceSelection } from "../types/domain";
import { isAvailable } from "./selectionRules.ts";
export const stages = [
  "configuracao",
  "identificacao",
  "dados",
  "documentos",
  "condicoes",
  "revisao",
  "pagamento",
  "confirmacao",
];
export const stageLabels = [
  "Opções",
  "Identificação",
  "Dados",
  "Documentos",
  "Condições",
  "Revisão",
  "Pagamento",
  "Confirmação",
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
    person.cpf === "DEMO-CPF" &&
    person.phone === "DEMO-TELEFONE" &&
    person.email === "participante@example.invalid" &&
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
export function conditionsReady(item: RaceSelection, race: Race) {
  return race.conditions.every((c) => item.acceptedConditions.includes(c.id));
}
export function selectionReady(draft: Draft, catalog: Race[]) {
  return (
    draft.items.length > 0 &&
    new Set(draft.items.map((i) => i.raceId)).size === draft.items.length &&
    draft.items.every((item) => {
      const race = catalog.find((r) => r.id === item.raceId);
      return race && isAvailable(race) && optionsReady(item, race);
    })
  );
}
export function pendingStage(draft: Draft, catalog: Race[]): string {
  if (!selectionReady(draft, catalog)) return "configuracao";
  if (!draft.identified) return "identificacao";
  if (!personReady(draft.person)) return "dados";
  if (
    !draft.items.every((i) => {
      const race = catalog.find((r) => r.id === i.raceId)!;
      return fieldsReady(i) && documentsReady(i, race, draft.sharedDocuments);
    })
  )
    return "documentos";
  if (
    !draft.items.every((i) =>
      conditionsReady(
        i,
        catalog.find((r) => r.id === i.raceId)!,
      ),
    )
  )
    return "condicoes";
  return "revisao";
}
