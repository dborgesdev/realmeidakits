import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "../../state/AccountContext";
import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import { money, totalPrice } from "../../state/pricing";
import { accountUrl } from "../../data/accountClient";
import OrderSummary from "./OrderSummary";

type CreatedOrder = { number: string; checkoutUrl: string | null };

export default function PaymentStep() {
  const { request } = useAccount();
  const { events } = useCatalog();
  const { draft, persistence } = useRequest();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const total = totalPrice(
    draft.participants.flatMap((person) => person.items),
    events,
  );

  async function finalize() {
    setBusy(true);
    setError("");
    try {
      const result = await request<CreatedOrder>("/account/orders", "POST", {
        version: persistence.version,
        expectedCents: total.known,
      });
      if (result.checkoutUrl)
        location.assign(accountUrl(result.checkoutUrl, ""));
      else setNumber(result.number);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível finalizar a solicitação.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Finalizar solicitação de retirada</h1>
      <p>
        Escolha o meio de pagamento no checkout do WooCommerce. O valor depende
        da modalidade e das opções escolhidas.
      </p>
      <p className="help-panel">
        Total dos serviços e adicionais{" "}
        <strong>{total.pending ? "A confirmar" : money(total.known)}</strong>
      </p>
      {draft.participants.map((person) => (
        <section key={person.id}>
          <h2>{person.person.name}</h2>
          <OrderSummary items={person.items} />
        </section>
      ))}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {number ? (
        <p role="status">
          Pedido {number}. <Link to="/acompanhamento">Acompanhar pedido</Link>
        </p>
      ) : (
        <button
          type="button"
          className="button"
          disabled={
            busy ||
            persistence.status !== "saved" ||
            !!total.pending ||
            total.known <= 0
          }
          onClick={() => void finalize()}
        >
          {busy ? "Validando solicitação…" : "Finalizar e abrir checkout"}
        </button>
      )}
    </>
  );
}
