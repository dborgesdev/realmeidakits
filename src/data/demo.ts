export type Draft = {
  slug: string;
  modality: "oficial" | "appai";
  name: string;
  birthDate: string;
  phone: string;
  identified: boolean;
  membership: string;
  kit: string;
  size: string;
  documents: Record<string, string>;
  authorized: boolean;
  confirmed: boolean;
  method: string;
};
export const initial: Draft = {
  slug: "",
  modality: "oficial",
  name: "Participante de demonstração",
  birthDate: "1990-01-01",
  phone: "DEMO-TELEFONE",
  identified: false,
  membership: "DEMO-101",
  kit: "camiseta",
  size: "M",
  documents: {},
  authorized: false,
  confirmed: false,
  method: "Pix",
};
