import type { Draft, Race, ConditionAcceptances } from "../types/domain";
// Identificação + conteúdo exato: editar uma minuta invalida seu aceite anterior.
export function conditionVersion(condition: Race["conditions"][number]) {
  return JSON.stringify([condition.id, condition.text]);
}
export function conditionsReady(accepted: ConditionAcceptances, race: Race) {
  return race.conditions.every((c) =>
    (accepted[race.id] || []).includes(conditionVersion(c)),
  );
}
export function acceptCondition(
  draft: Draft,
  race: Race,
  conditionId: string,
  checked: boolean,
): Draft {
  if (draft.order || !draft.selectedRaceIds.includes(race.id)) return draft;
  const condition = race.conditions.find((c) => c.id === conditionId);
  if (!condition) return draft;
  const current = (draft.acceptedConditions[race.id] || []).filter((version) =>
    race.conditions.some((c) => conditionVersion(c) === version),
  );
  const version = conditionVersion(condition);
  return {
    ...draft,
    acceptedConditions: {
      ...draft.acceptedConditions,
      [race.id]: checked
        ? Array.from(new Set([...current, version]))
        : current.filter((v) => v !== version),
    },
  };
}
