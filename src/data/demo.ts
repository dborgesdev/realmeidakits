import type { Draft, Participant } from "../types/domain";
export type { Draft } from "../types/domain";
export function makeParticipant(number: number): Participant {
  const suffix = String(number).padStart(3, "0");
  return {
    id: `p${number}`,
    person: {
      name: `Participante ${number} de demonstração`,
      cpf: `DEMO-CPF-${suffix}`,
      birthDate: "1990-01-01",
      phone: `DEMO-TELEFONE-${suffix}`,
      email: `participante${number}@example.invalid`,
    },
    items: [],
    documents: {},
    existingDocumentIds: number === 1 ? ["identity"] : [],
    reuseAuthorized: false,
  };
}
export function initialDraft(): Draft {
  return {
    selectedRaceIds: [],
    participants: [makeParticipant(1)],
    responsible: {
      name: "Responsável de demonstração",
      email: "responsavel@example.invalid",
      phone: "DEMO-TELEFONE-RESP",
      identifier: "DEMO-RESPONSAVEL",
    },
    prepared: false,
    nextParticipantNumber: 2,
    method: "Pix",
  };
}
