import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import { money, totalPrice } from "../../state/pricing";
import OrderSummary from "./OrderSummary";
export default function PaymentStep() {
  const { events } = useCatalog();
  const { draft, setDraft } = useRequest();
  const items = draft.participants.flatMap((p) => p.items);
  return (
    <>
      <h1>Pagamento do serviço de retirada</h1>
      <p className="field-help" role="status">
        Pedidos e pagamentos ainda indisponíveis. Nenhuma solicitação foi
        enviada.
      </p>
      <fieldset className="payment-choices">
        <legend>Valores por forma de pagamento</legend>
        {(["Pix", "Cartão"] as const).map((method) => {
          const total = totalPrice(items, events, method);
          return (
            <label className="radio payment-option" key={method}>
              <input
                type="radio"
                name="method"
                checked={draft.method === method}
                onChange={() => setDraft((d) => ({ ...d, method }))}
              />
              <span>
                <strong>
                  {method} · {money(total.known)}
                  {total.pending ? " + a confirmar" : ""}
                </strong>
                <span className="field-help">
                  {items.length} serviço(s) de retirada
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      {draft.participants.map((p) => (
        <section key={p.id}>
          <h2>{p.person.name}</h2>
          <OrderSummary items={p.items} method={draft.method} />
        </section>
      ))}
    </>
  );
}
