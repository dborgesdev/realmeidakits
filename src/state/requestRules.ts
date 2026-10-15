// Requisitos do protótipo: nunca representam validação documental de produção.
export const stages = [
  "modalidade",
  "identificacao",
  "dados",
  "documentos",
  "revisao",
  "pagamento",
  "confirmacao",
];
export function requiredDocuments(authorization: boolean) {
  return [
    "Comprovante de inscrição",
    "Documento com foto",
    ...(authorization ? ["Autorização específica"] : []),
  ];
}
export function documentsReady(
  documents: Record<string, string>,
  authorization: boolean,
  authorized: boolean,
) {
  return (
    requiredDocuments(authorization).every((key) => Boolean(documents[key])) &&
    (!authorization || authorized)
  );
}
// Validação apenas dos campos fictícios e das variações representadas na prévia.
export function dataReady(
  draft: {
    name: string;
    modality: string;
    membership: string;
    kit: string;
    size: string;
    birthDate: string;
    phone: string;
  },
  requirements: { birthDateRequired: boolean; phoneRequired: boolean },
) {
  if (draft.name.trim().length < 3 || draft.name.length > 80) return false;
  if (
    requirements.birthDateRequired &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) ||
      !Number.isFinite(Date.parse(draft.birthDate)) ||
      (Number.isFinite(Date.parse(draft.birthDate)) &&
        new Date(draft.birthDate).toISOString().slice(0, 10) !==
          draft.birthDate) ||
      draft.birthDate < "1900-01-01" ||
      draft.birthDate > new Date().toISOString().slice(0, 10))
  )
    return false;
  if (requirements.phoneRequired && draft.phone !== "DEMO-TELEFONE")
    return false;
  if (draft.modality === "oficial") return true;
  return (
    draft.modality === "appai" &&
    /^DEMO-\d{3,6}$/.test(draft.membership) &&
    (draft.kit === "numero" ||
      (draft.kit === "camiseta" &&
        ["PP", "P", "M", "G", "GG"].includes(draft.size)))
  );
}
