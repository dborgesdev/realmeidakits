import FilePicker from "../FilePicker";
import { useState } from "react";
import { useAccount } from "../../state/AccountContext";

export type OrderDocument = {
  id: string;
  label: string;
  required: boolean;
  status: "missing" | "received" | "approved" | "rejected";
  reused: boolean;
  reason: string;
  canReplace: boolean;
};

const labels = {
  missing: "Pendente",
  received: "Recebido, aguardando análise",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export default function OrderDocumentList({
  order,
  line,
  documents,
  refresh,
}: {
  order: number;
  line: number;
  documents: OrderDocument[];
  refresh: () => void;
}) {
  const { request } = useAccount();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function replace(document: OrderDocument, file: File) {
    setError("");
    setMessage("");
    setBusy(document.id);
    const body = new FormData();
    body.set("line", String(line));
    body.set("requirement", document.id);
    body.set("file", file);
    try {
      await request(`/account/orders/${order}/documents`, "POST", body);
      setMessage("Documento atualizado. Aguardando nova análise.");
      refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível enviar o documento.",
      );
    } finally {
      setBusy("");
    }
  }

  if (!documents.length) return null;
  return (
    <ul className="account-order-documents" aria-busy={!!busy}>
      {documents.map((document) => (
        <li key={document.id}>
          <strong>{document.label}</strong> ·{" "}
          {document.required ? "Obrigatório" : "Opcional"}
          <p>
            {document.reused ? "Reutilização confirmada · " : ""}
            {labels[document.status]}
          </p>
          {document.reason && <p>Motivo: {document.reason}</p>}
          {document.canReplace && (
            <FilePicker
              label={
                document.status === "missing"
                  ? "Enviar documento"
                  : "Enviar novo arquivo para esta solicitação"
              }
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={!!busy}
              onFile={(file) => void replace(document, file)}
            />
          )}
        </li>
      ))}
      {(message || busy) && (
        <li role="status">{busy ? "Enviando arquivo…" : message}</li>
      )}
      {error && (
        <li role="alert" className="error">
          {error}
        </li>
      )}
    </ul>
  );
}
