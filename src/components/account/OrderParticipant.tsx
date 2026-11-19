import { accountUrl } from "../../data/accountClient";
import OrderDocumentList, { type OrderDocument } from "./OrderDocumentList";

const documentStatuses = {
  pending_review: "Em análise",
  not_required: "Sem documentos exigidos",
  pending_documents: "Pendente",
  approved: "Aprovada",
};

export type OrderLine = {
  raceId: string;
  race: string;
  participantId: number;
  participant: string;
  modality: string;
  documentStatus: keyof typeof documentStatuses;
  pickupStatus: "pending" | "ready" | "collected";
  bib: string | null;
  documentLine?: number;
  documents?: OrderDocument[];
  voucher?: {
    state: string;
    label: string;
    reason: string;
    pdfUrl: string | null;
    collectedAt?: string | null;
  };
};

export default function OrderParticipant({
  order,
  line,
  multiple,
  refresh,
}: {
  order: number;
  line: OrderLine;
  multiple: boolean;
  refresh: () => void;
}) {
  const voucher = line.voucher;
  const collectedAt = voucher?.collectedAt;
  return (
    <li id={`pedido-${order}-participante-${line.documentLine ?? 0}`}>
      {multiple && <h2 className="account-order-line-title">{line.race}</h2>}
      <div className="account-order-groups">
        <section>
          <h3>Participante</h3>
          <p>
            <strong>{line.participant}</strong>
          </p>
          <p>{line.modality === "appai" ? "APPAI" : "Kit Oficial"}</p>
          {line.bib && <p>Número de peito {line.bib}</p>}
        </section>
        <section>
          <h3>Documentação</h3>
          <span
            className="account-order-status"
            data-state={line.documentStatus}
          >
            {documentStatuses[line.documentStatus]}
          </span>
          <OrderDocumentList
            order={order}
            line={line.documentLine ?? 0}
            documents={line.documents ?? []}
            refresh={refresh}
          />
        </section>
        <section>
          <h3>Voucher</h3>
          {voucher ? (
            <>
              <span className="account-order-status" data-state={voucher.state}>
                {voucher.label}
              </span>
              {voucher.state !== "released" && voucher.reason && (
                <p>{voucher.reason}</p>
              )}
              {voucher.pdfUrl && (
                <p>
                  <a className="button" href={accountUrl(voucher.pdfUrl, "")}>
                    Baixar voucher PDF
                  </a>
                </p>
              )}
            </>
          ) : (
            <p>Indisponível</p>
          )}
        </section>
        <section>
          <h3>Retirada</h3>
          <p>
            {line.pickupStatus === "collected"
              ? "Realizada"
              : line.pickupStatus === "ready"
                ? "Kit liberado"
                : "Pendente"}
          </p>
          {collectedAt && (
            <p>
              {new Date(collectedAt.replace(" ", "T")).toLocaleString("pt-BR")}
            </p>
          )}
        </section>
      </div>
    </li>
  );
}
