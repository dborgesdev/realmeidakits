import type { Draft, Participant } from "../types/domain";
export type { Draft } from "../types/domain";
export function makeParticipant(number: number): Participant {
  return {
    id: `p${number}`,
    person: {
      name: "",
      cpf: "",
      birthDate: "",
      phone: "",
      email: "",
    },
    items: [],
    documents: {},
    existingDocumentIds: [],
    reuseAuthorized: false,
  };
}
export function initialDraft(): Draft {
  return {
    selectedRaceIds: [],
    acceptedConditions: {},
    participants: [makeParticipant(1)],
    responsible: {
      name: "",
      email: "",
      phone: "",
      identifier: "",
    },
    prepared: false,
    nextParticipantNumber: 2,
    method: "Pix",
  };
}
