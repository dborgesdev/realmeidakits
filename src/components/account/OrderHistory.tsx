import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountUrl } from "../../data/accountClient";
import OrderDocumentList, { type OrderDocument } from "./OrderDocumentList";
import { useAccount } from "../../state/AccountContext";

type Order = {
  id: number;
  number: string | null;
  createdAt: string;
  total: string;
  paymentStatus: string;
  paid: boolean;
  refunded: number;
  checkoutUrl: string | null;
  lines: {
    raceId: string;
    race: string;
    participantId: number;
    participant: string;
    modality: string;
    documentStatus:
      "pending_review" | "not_required" | "pending_documents" | "approved";
    pickupStatus: "pending" | "ready" | "collected";
    bib: string | null;
    documentLine?: number;
    documents?: OrderDocument[];
  }[];
};

function financialStatus(order: Order) {
  if (order.paymentStatus === "unavailable")
    return "Vínculo financeiro em conferência";
  if (order.paymentStatus === "refunded") return "Reembolsado";
  if (order.paymentStatus === "cancelled") return "Cancelado";
  if (order.paymentStatus === "failed") return "Pagamento falhou";
  if (Number(order.refunded) > 0) return "Reembolso parcial";
  if (order.paid) return "Pago";
  if (order.paymentStatus === "on-hold") return "Em análise no WooCommerce";
  return "Aguardando pagamento";
}

export default function OrderHistory() {
  const { profile, status, sessionVersion } = useAccount();
  if (status === "loading") return <p role="status">Verificando a sessão…</p>;
  if (!profile || status !== "authenticated")
    return (
      <p>
        <Link to="/conta">Entre na sua conta para consultar pedidos</Link>.
      </p>
    );
  return <OrdersForSession key={profile.id + ":" + sessionVersion} />;
}

function OrdersForSession() {
  const { status, request } = useAccount();
  const [result, setResult] = useState<{ orders: Order[] } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    request<{ orders: Order[] }>("/account/orders")
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível consultar os pedidos.",
          );
      });
    return () => {
      active = false;
    };
  }, [status, request, attempt]);

  if (status === "loading") return <p role="status">Verificando a sessão…</p>;
  if (status !== "authenticated")
    return (
      <p>
        <Link to="/conta">Entre na sua conta para consultar pedidos</Link>.
      </p>
    );
  if (error)
    return (
      <div>
        <p role="alert">{error}</p>
        <button
          className="text-button"
          onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  if (!result) return <p role="status">Carregando pedidos…</p>;
  if (!result.orders.length)
    return <p>Nenhum pedido de retirada registrado.</p>;
  return (
    <ul className="form-section">
      {result.orders.map((order) => (
        <li key={order.id}>
          <details>
            <summary>
              {order.number
                ? "Pedido " + order.number
                : "Solicitação " + order.id}{" "}
              · {financialStatus(order)} ·{" "}
              {Number(order.total).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </summary>
            <p>
              Data{" "}
              {new Date(
                order.createdAt.replace(" ", "T") + "Z",
              ).toLocaleDateString("pt-BR")}
            </p>
            <ul>
              {order.lines.map((line) => (
                <li key={line.raceId + "-" + line.participantId}>
                  <strong>
                    {line.race} · {line.participant}
                  </strong>
                  <p>
                    Modalidade{" "}
                    {line.modality === "appai" ? "APPAI" : "Kit Oficial"}
                  </p>
                  <p>
                    {
                      {
                        pending_review: "Documentos aguardando análise",
                        not_required: "Sem arquivo exigido",
                        pending_documents: "Documentos pendentes",
                        approved: "Documentos aprovados",
                      }[line.documentStatus]
                    }
                    .{" "}
                    {
                      {
                        pending: "Retirada pendente",
                        ready: "Kit liberado",
                        collected: "Kit retirado",
                      }[line.pickupStatus]
                    }
                    .
                  </p>
                  {line.bib && <p>Número de peito {line.bib}</p>}
                  <OrderDocumentList
                    order={order.id}
                    line={line.documentLine ?? 0}
                    documents={line.documents ?? []}
                    refresh={() => setAttempt((value) => value + 1)}
                  />
                </li>
              ))}
            </ul>
            {order.checkoutUrl && (
              <a href={accountUrl(order.checkoutUrl, "")}>
                Abrir checkout WooCommerce
              </a>
            )}
          </details>
        </li>
      ))}
    </ul>
  );
}
