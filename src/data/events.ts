import type {
  DocumentRequirement,
  ModalityConfig,
  Race,
} from "../types/domain";
export type { Race } from "../types/domain";
const identity: DocumentRequirement = {
  id: "identity",
  label: "Documento de identificação com foto",
  scope: "personal",
};
const registration: DocumentRequirement = {
  id: "registration",
  label: "Comprovante de inscrição",
  scope: "race",
};
const authorization: DocumentRequirement = {
  id: "authorization",
  label: "Autorização específica de retirada",
  scope: "race",
};
function official(
  documents: DocumentRequirement[],
  pix = 2600,
  card = 3000,
): ModalityConfig {
  return {
    id: "oficial",
    label: "Kit Oficial",
    documents,
    prices: { pix, card },
    sizes: [],
  };
}
function appai(
  documents: DocumentRequirement[],
  sizes: string[],
  pix = 2600,
  card = 3000,
): ModalityConfig {
  return {
    id: "appai",
    label: "Associado à APPAI",
    documents,
    sizes,
    prices: { pix, card },
    shirtPrices: { pix, card },
    numberPrices: { pix: 2000, card: 2400 },
  };
}
// Todas as datas, preços, opções e exigências abaixo são fixtures, não ofertas reais.
export const events: Race[] = [
  {
    id: "rio",
    slug: "circuito-rio-antigo",
    name: "Circuito Rio Antigo",
    image: "event-circuito-rio-antigo.webp",
    description: "Um cenário urbano para experimentar a jornada de retirada.",
    status: "open",
    closesAt: "2026-11-20T18:00:00-03:00",
    raceDate: "2026-11-29",
    modalities: [
      official([identity, registration, authorization]),
      appai([identity, authorization], ["P", "M", "G", "GG"]),
    ],
    distances: ["5 km", "10 km"],
    kitTypes: ["Kit tradicional", "Kit completo"],
    pickupLocations: [
      "Ponto de retirada A — exemplo",
      "Ponto de retirada B — exemplo",
    ],
    conditions: [
      {
        id: "rio-prazo-v1-demo",
        text: "Minuta para validação: em caso de não comparecimento, a camiseta ficará disponível por até dois meses. Após esse prazo, o kit poderá ser destinado a doação. Esta condição é ilustrativa e depende de validação jurídica e operacional.",
      },
    ],
    guidance:
      "Autorização específica desta corrida no exemplo. Local e horário operacionais serão confirmados na versão funcional.",
  },
  {
    id: "primavera",
    slug: "corrida-primavera",
    name: "Corrida da Primavera",
    image: "event-corrida-primavera.webp",
    description:
      "Explore modalidades e documentos diferentes no mesmo pedido de exemplo.",
    status: "open",
    closesAt: "2026-11-25T17:00:00-03:00",
    modalities: [
      official([registration]),
      appai([identity], ["PP", "P", "M", "G"]),
    ],
    distances: ["5 km", "10 km"],
    kitTypes: [],
    pickupLocations: [],
    conditions: [
      {
        id: "primavera-v1-demo",
        text: "Condição de exemplo: a retirada será organizada em local e horário a confirmar. Confira as orientações específicas antes da operação real. Texto sujeito à validação; não constitui condição jurídica definitiva.",
      },
    ],
    guidance:
      "Neste exemplo, Kit Oficial exige apenas comprovante de inscrição; APPAI utiliza identificação pessoal reutilizável.",
  },
  {
    id: "cidade",
    slug: "desafio-10k-cidade",
    name: "Desafio 10K da Cidade",
    image: "event-desafio-10k-cidade.webp",
    description:
      "Experimente opções APPAI e acompanhe o número de peito por corrida.",
    status: "open",
    modalities: [
      appai(
        [
          identity,
          authorization,
          {
            id: "association",
            label: "Declaração demonstrativa da modalidade",
            scope: "race",
          },
        ],
        ["M", "G", "GG"],
        2800,
        3200,
      ),
    ],
    distances: ["5 km", "10 km"],
    kitTypes: [],
    pickupLocations: ["Ponto da prova — exemplo"],
    conditions: [
      {
        id: "cidade-v1-demo",
        text: "Condição de exemplo: a autorização e a declaração são específicas desta corrida. Não reutilize a autorização de outra prova. Orientações e condições finais ainda serão validadas.",
      },
    ],
    guidance:
      "Somente APPAI nesta configuração ilustrativa. Atribuição de número de peito é independente do pagamento e da retirada.",
  },
  {
    id: "rio-encerrada",
    slug: "circuito-rio-antigo-encerrado",
    name: "Circuito Rio Antigo — edição encerrada",
    image: "event-circuito-rio-antigo.webp",
    description:
      "Cenário ilustrativo para conhecer o encerramento das solicitações.",
    status: "closed",
    closesAt: "2026-10-01T18:00:00-03:00",
    modalities: [official([identity, registration])],
    distances: ["5 km"],
    kitTypes: [],
    pickupLocations: [],
    conditions: [],
    guidance:
      "Prazo encerrado no cenário de demonstração. Não aceita novas seleções.",
  },
];
export const asset = (file: string) => `/images/home/${file}`;
export const findRace = (id: string) => events.find((event) => event.id === id);
