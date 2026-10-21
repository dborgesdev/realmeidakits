import type { Draft, Participant, Race } from "../types/domain";
import { personReady, requiredDocuments, fieldsReady } from "./requestRules.ts";
import { conditionVersion } from "./conditionRules.ts";
import { isAvailable } from "./selectionRules.ts";
export type FlowIssue = {
  target: string;
  message: string;
  participantId?: string;
};
export function controlId(
  field: string,
  participantId?: string,
  raceId?: string,
  detail?: string,
) {
  return [field, participantId, raceId, detail].filter(Boolean).join("--");
}
export function missingDocuments(p: Participant, catalog: Race[]) {
  const personal = new Set<string>();
  let count = 0;
  for (const item of p.items) {
    const race = catalog.find((r) => r.id === item.raceId);
    if (!race) continue;
    for (const doc of requiredDocuments(item, race)) {
      if (doc.scope === "personal") {
        if (!p.documents[doc.id]) personal.add(doc.id);
      } else if (!item.documents[doc.id]) count++;
    }
  }
  return count + personal.size;
}
export function firstIssue(
  stage: string,
  draft: Draft,
  catalog: Race[],
): FlowIssue | null {
  const issue = (
    field: string,
    message: string,
    p?: Participant,
    raceId?: string,
    detail?: string,
  ): FlowIssue => ({
    target: controlId(field, p?.id, raceId, detail),
    message,
    participantId: p?.id,
  });
  if (
    stage === "responsavel" &&
    (!draft.responsible.name.trim() ||
      draft.responsible.name.trim().length < 3 ||
      draft.responsible.name.length > 80)
  )
    return issue(
      "responsible-name",
      "Informe o nome fictício da pessoa responsável (3 a 80 caracteres).",
    );
  if (stage === "participantes")
    for (const [index, p] of draft.participants.entries()) {
      if (!personReady(p.person)) {
        const nameInvalid =
          p.person.name.trim().length < 3 || p.person.name.length > 80;
        return issue(
          nameInvalid ? "name" : "birthDate",
          `Informe ${nameInvalid ? "o nome fictício" : "uma data de nascimento válida"} do participante ${index + 1}.`,
          p,
        );
      }
      if (
        draft.participants.some(
          (other) => other.id !== p.id && other.person.cpf === p.person.cpf,
        )
      )
        return issue(
          "name",
          `Confira a identidade demonstrativa do participante ${index + 1}.`,
          p,
        );
      if (!p.items.length)
        return issue(
          "races",
          `Escolha ao menos uma corrida para o participante ${index + 1}.`,
          p,
        );
      for (const item of p.items) {
        const race = catalog.find((r) => r.id === item.raceId);
        if (
          !race ||
          !draft.selectedRaceIds.includes(item.raceId) ||
          !isAvailable(race)
        )
          return issue(
            "races",
            `Remova a corrida indisponível do participante ${index + 1}.`,
            p,
          );
        const mode = race.modalities.find((m) => m.id === item.modality);
        if (!mode)
          return issue(
            "modality",
            `Selecione a modalidade para ${race.name}.`,
            p,
            race.id,
          );
        if (!race.distances.includes(item.distance))
          return issue(
            "distance",
            `Selecione a distância para ${race.name}.`,
            p,
            race.id,
          );
        if (
          item.modality === "oficial" &&
          race.kitTypes.length &&
          !race.kitTypes.includes(item.kitType)
        )
          return issue(
            "kitType",
            `Selecione o tipo de kit para ${race.name}.`,
            p,
            race.id,
          );
        if (
          item.modality === "appai" &&
          item.kit === "camiseta" &&
          !mode.sizes.includes(item.size)
        )
          return issue(
            "size",
            `Selecione o tamanho da camiseta para ${race.name}.`,
            p,
            race.id,
          );
        if (
          race.pickupLocations.length &&
          !race.pickupLocations.includes(item.pickup)
        )
          return issue(
            "pickup",
            `Selecione o local de retirada para ${race.name}.`,
            p,
            race.id,
          );
        if (!fieldsReady(item))
          return issue(
            item.modality === "appai" ? "membership" : "registration",
            `Informe ${item.modality === "appai" ? "a matrícula APPAI fictícia (DEMO- e 3 a 6 dígitos)" : "o número fictício da inscrição (DEMO- e 3 a 40 caracteres)"} para ${race.name}.`,
            p,
            race.id,
          );
      }
    }
  if (stage === "documentos")
    for (const p of draft.participants)
      for (const item of p.items) {
        const race = catalog.find((r) => r.id === item.raceId);
        if (!race) continue;
        for (const doc of requiredDocuments(item, race)) {
          if (
            !(doc.scope === "personal" ? p.documents : item.documents)[doc.id]
          )
            return issue(
              "document",
              `Adicione ${doc.label.toLowerCase()} ${doc.scope === "race" ? `para ${race.name}` : `de ${p.person.name}`}.`,
              p,
              doc.scope === "race" ? race.id : undefined,
              doc.id,
            );
        }
      }
  if (stage === "condicoes")
    for (const race of catalog.filter((r) =>
      draft.selectedRaceIds.includes(r.id),
    ))
      for (const condition of race.conditions)
        if (
          !(draft.acceptedConditions[race.id] || []).includes(
            conditionVersion(condition),
          )
        )
          return issue(
            "condition",
            `Leia e aceite as condições de ${race.name}.`,
            undefined,
            race.id,
            condition.id,
          );
  return null;
}
