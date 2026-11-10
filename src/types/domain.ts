export type Modality = "oficial" | "appai";
export type DocumentRequirement = {
  id: string;
  label: string;
  scope: "personal" | "race";
  required?: boolean;
  guidance?: string;
  requiresUpload?: boolean;
  requiresSignature?: boolean;
  purpose?: string;
  version?: number;
  template?: { url: string; name: string; mime: "application/pdf" } | null;
};
export type ModalityConfig = {
  id: Modality;
  label: string;
  documents: DocumentRequirement[];
  sizes: string[];
  distances?: string[];
  pickupLocations?: string[];
  pickupDetails?: {
    id: string;
    label: string;
    address: string;
    at: string;
    guidance: string;
  }[];
  kitTypes?: string[];
  kitAdditions?: Record<string, number>;
  shirtEnabled?: boolean;
  numberEnabled?: boolean;
  shirtImage?: string;
  requireRegistration?: boolean;
  requireMembership?: boolean;
};
export type Race = {
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  raceDate?: string;
  opensAt?: string;
  raceTime?: string;
  location?: string;
  contact?: string;
  source?: "wordpress";
  priceCents: number | null;
  prices?: {
    official: number | null;
    shirt: number | null;
    number: number | null;
  };
  closesAt?: string;
  status: "open" | "closed" | "unavailable";
  modalities: ModalityConfig[];
  distances: string[];
  kitTypes: string[];
  pickupLocations: string[];
  conditions: { id: string; text: string; version?: number }[];
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
};
export type Person = {
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
};
export type Responsible = {
  name: string;
  email: string;
  phone: string;
  identifier: string;
};
export type Participant = {
  directoryId?: number;
  directoryVersion?: number;
  id: string;
  person: Person;
  items: RaceSelection[];
  documents: Record<string, string>;
  existingDocumentIds: string[];
  reuseAuthorized: boolean;
};
export type ConditionAcceptances = Record<string, string[]>;
export type DemoOrder = {
  acceptedConditions: ConditionAcceptances;
  id: string;
  responsible: Responsible;
  participants: Participant[];
};
export type Draft = {
  preferredModality?: Modality;
  acceptedConditions: ConditionAcceptances;
  selectedRaceIds: string[];
  participants: Participant[];
  responsible: Responsible;
  prepared: boolean;
  nextParticipantNumber: number;
  order?: DemoOrder;
};
