import type { DocumentRequirement, Modality } from "../types/domain";
export type ApiImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};
export type ApiPickup = {
  id: string;
  label: string;
  address: string;
  at: string;
  guidance: string;
};
export type ApiModality = {
  id: Modality;
  label: string;
  requireRegistration: boolean;
  requireMembership: boolean;
  distances: string[];
  pickups: ApiPickup[];
  kitTypes: { id: string; label: string; additionalCents?: number }[];
  shirtEnabled: boolean;
  numberEnabled: boolean;
  sizes: string[];
  shirtImage: ApiImage | null;
  documents: (DocumentRequirement & { required: boolean; guidance: string })[];
};
export type ApiRace = {
  priceCents: number | null;
  prices?: {
    official: number | null;
    shirt: number | null;
    number: number | null;
  };
  id: string;
  slug: string;
  name: string;
  description: string;
  image: ApiImage | null;
  raceDate: string;
  raceTime: string;
  location: string;
  opensAt: string;
  closesAt: string;
  status: "open" | "closed" | "unavailable";
  modalities: ApiModality[];
  conditions: { id: string; text: string; version: number; active: boolean }[];
  guidance: string;
  contact: string;
  whatsappUrl: string;
};
export type ApiPage = {
  data: ApiRace[];
  page: number;
  totalPages: number;
  total: number;
};
