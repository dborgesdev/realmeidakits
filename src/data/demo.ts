import type { Draft } from "../types/domain";
export type { Draft } from "../types/domain";
export function initialDraft(): Draft {
  return {
    items: [],
    person: {
      name: "Participante de demonstração",
      cpf: "DEMO-CPF",
      birthDate: "1990-01-01",
      phone: "DEMO-TELEFONE",
      email: "participante@example.invalid",
    },
    identified: false,
    sharedDocuments: {},
    method: "Pix",
  };
}
