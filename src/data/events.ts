export const events = [
  {
    slug: "circuito-rio-antigo",
    name: "Circuito Rio Antigo",
    image: "event-circuito-rio-antigo.webp",
    description: "Um cenário urbano para experimentar a jornada de retirada.",
    authorization: true,
    birthDateRequired: true,
    phoneRequired: true,
  },
  {
    slug: "corrida-primavera",
    name: "Corrida da Primavera",
    image: "event-corrida-primavera.webp",
    description: "Explore as modalidades e organize os documentos do exemplo.",
    authorization: false,
    birthDateRequired: false,
    phoneRequired: false,
  },
  {
    slug: "desafio-10k-cidade",
    name: "Desafio 10K da Cidade",
    image: "event-desafio-10k-cidade.webp",
    description: "Experimente a solicitação e veja o voucher ilustrativo.",
    authorization: true,
    birthDateRequired: true,
    phoneRequired: true,
  },
];
export type Race = (typeof events)[number];
export const asset = (file: string) => `/images/home/${file}`;
