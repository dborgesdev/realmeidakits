export type Modality = "oficial" | "appai";
export type PaymentMethod = "Pix" | "Cartão";
export type DocumentRequirement = {
  id: string;
  label: string;
  scope: "personal" | "race";
};
export type Prices = { pix: number | null; card: number | null };
export type ModalityConfig = {
  id: Modality;
  label: string;
  documents: DocumentRequirement[];
  prices: Prices;
  shirtPrices?: Prices;
  numberPrices?: Prices;
  sizes: string[];
};
export type Race = {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  raceDate?: string;
  closesAt?: string;
  status: "open" | "closed" | "unavailable";
  modalities: ModalityConfig[];
  distances: string[];
  kitTypes: string[];
  pickupLocations: string[];
  conditions: { id: string; text: string }[];
  guidance: string;
  whatsappUrl?: string;
};
export type RaceSelection = {
  raceId: string;
  modality: Modality;
  distance: string;
  kitType: string;
  kit: "camiseta" | "numero";
  size: string;
  membership: string;
  registration: string;
  pickup: string;
  documents: Record<string, string>;
  acceptedConditions: string[];
};
export type Person = {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};
export type DemoOrder = {
  id: string;
  person: Person;
  items: RaceSelection[];
  sharedDocuments: Record<string, string>;
  method: PaymentMethod;
};
export type Draft = {
  items: RaceSelection[];
  person: Person;
  identified: boolean;
  sharedDocuments: Record<string, string>;
  method: PaymentMethod;
  order?: DemoOrder;
};
