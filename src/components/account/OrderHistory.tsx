import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { accountUrl } from "../../data/accountClient";
import OrderParticipant, { type OrderLine } from "./OrderParticipant";
import { ChevronDown } from "lucide-react";
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
  paymentNotice?: string | null;
  lines: OrderLine[];
};

function financialStatus(order: Order) {
  if (order.paymentStatus === "unavailable")
    return "Em conferência";
  if (order.paymentStatus === "refunded") return "Reembolsado";
  if (order.paymentStatus === "cancelled") return "Cancelado";
  if (order.paymentStatus === "failed") return "Pagamento falhou";
  if (Number(order.refunded) > 0) return "Reembolso parcial";
  if (order.paid) return "Pago";
  if (["processing", "completed"].includes(order.paymentStatus))
    return "Em conferência";
  if (order.paymentStatus === "on-hold") return "Em análise";
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
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("pedido");
    if (result && id && /^[1-9][0-9]*$/.test(id)) {
      const line = new URLSearchParams(window.location.search).get(
        "documentos",
      );
      const target =
        line !== null && /^[0-9]+$/.test(line)
          ? "pedido-" + id + "-participante-" + line
          : "pedido-" + id;
      window.requestAnimationFrame(() =>
        document.getElementById(target)?.scrollIntoView({ block: "start" }),
      );
    }
  }, [result]);

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
    <ul className="account-order-list">
      {result.orders.map((order) => (
        <li key={order.id}>
          <details
            id={"pedido-" + order.id}
            open={
              new URLSearchParams(window.location.search).get("pedido") ===
              String(order.id)
                ? true
                : undefined
            }
          >
            <summary>
              <span className="account-order-heading">
                <strong className="account-order-race">
                  {[
                    ...new Set(
                      order.lines.map((line) => line.race).filter(Boolean),
                    ),
                  ].join(" · ") || "Retirada de kit"}
                </strong>
                <span className="account-order-meta">
                  {order.number
                    ? "Pedido " + order.number
                    : "Solicitação " + order.id}
                  {" · "}
                  {new Date(
                    order.createdAt.replace(" ", "T") + "Z",
                  ).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span className="account-order-finance">
                <strong>
                  {Number(order.total).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
                <span
                  className="account-order-status"
                  data-state={
                    order.paid && !Number(order.refunded)
                      ? "success"
                      : order.paymentStatus
                  }
                >
                  {financialStatus(order)}
                </span>
              </span>
              <ChevronDown
                className="account-order-chevron"
                size={20}
                aria-hidden="true"
              />
            </summary>
            <div className="account-order-body">
              {order.checkoutUrl && (
                <a className="button" href={accountUrl(order.checkoutUrl, "")}>
                  Continuar pagamento
                </a>
              )}
              <ul className="account-order-lines">
                {order.lines.map((line) => (
                  <OrderParticipant
                    key={line.raceId + "-" + line.participantId}
                    order={order.id}
                    line={line}
                    multiple={order.lines.length > 1}
                    refresh={() => setAttempt((value) => value + 1)}
                  />
                ))}
              </ul>
              {order.paymentNotice && (
                <p role="status">{order.paymentNotice}</p>
              )}
              {!order.checkoutUrl &&
                !order.paid &&
                [
                  "pending",
                  "failed",
                  "cancelled",
                  "refunded",
                  "on-hold",
                ].includes(order.paymentStatus) && (
                  <Link reloadDocument to="/corridas">
                    Iniciar nova solicitação para uma corrida aberta
                  </Link>
                )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
