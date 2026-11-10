import type { Draft, Participant } from "../../src/types/domain";
export type { Draft } from "../../src/types/domain";
export function syntheticCpf(number: number): string {
  let value = String(number + 10000).padStart(9, "0");
  for (let length = 9; length < 11; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(value[i]) * (length + 1 - i);
    const digit = (sum * 10) % 11;
    value += digit === 10 ? "0" : String(digit);
  }
  return value;
}
export function makeParticipant(number: number): Participant {
  const suffix = String(number).padStart(3, "0");
  return {
    id: `p${number}`,
    person: {
      name: `Participante ${number} de demonstração`,
      cpf: syntheticCpf(number),
      birthDate: "1990-01-01",
      phone: `2199999${suffix.padStart(4, "0")}`,
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
    acceptedConditions: {},
    participants: [makeParticipant(1)],
    responsible: {
      name: "Responsável de demonstração",
      email: "responsavel@example.invalid",
      phone: "21999999999",
      identifier: syntheticCpf(900),
    },
    prepared: false,
    nextParticipantNumber: 2,
  };
}
