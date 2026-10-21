import { previewConfig } from "../config/preview.ts";
import { makeParticipant } from "../data/demo.ts";
import { isAvailable, makeSelection } from "./selectionRules.ts";
import type { Draft, Race } from "../types/domain";
export function resizeParticipants(draft: Draft, count: number): Draft {
  if (
    draft.order ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > previewConfig.maxParticipants
  )
    return draft;
  const participants = draft.participants.slice(0, count);
  let next = draft.nextParticipantNumber;
  while (participants.length < count)
    participants.push(makeParticipant(next++));
  return {
    ...draft,
    prepared: true,
    participants,
    nextParticipantNumber: next,
  };
}
export function removeParticipant(draft: Draft, id: string): Draft {
  return draft.order || draft.participants.length <= 1
    ? draft
    : { ...draft, participants: draft.participants.filter((p) => p.id !== id) };
}
export function assignRace(
  draft: Draft,
  participantId: string,
  race: Race,
): Draft {
  if (draft.order || !draft.selectedRaceIds.includes(race.id)) return draft;
  return {
    ...draft,
    participants: draft.participants.map((p) =>
      p.id !== participantId
        ? p
        : {
            ...p,
            items: p.items.some((i) => i.raceId === race.id)
              ? p.items.filter((i) => i.raceId !== race.id)
              : isAvailable(race)
                ? [...p.items, makeSelection(race)]
                : p.items,
          },
    ),
  };
}
export function registrationCount(participants: Draft["participants"]) {
  return participants.reduce((total, p) => total + p.items.length, 0);
}
export function voucherId(participantId: string, raceId: string) {
  return `DEMO-VOUCHER-${participantId}-${raceId}`;
}
