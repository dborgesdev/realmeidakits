import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { money, totalPrice } from "../../state/pricing";
import OrderSummary from "./OrderSummary";
export default function PaymentStep() {
  const { draft, setDraft } = useDemo();
  return (
    <>
      <h1>Um pagamento para as suas corridas</h1>
      <p>
        Valores de demonstração, calculados por corrida e opção. Pix e cartão
        são apenas alternativas visuais; não há cobrança ou confirmação
        bancária.
      </p>
      <fieldset className="payment-choices">
        <legend>Escolha uma alternativa simulada</legend>
        {(["Pix", "Cartão"] as const).map((method) => {
          const total = totalPrice(draft.items, events, method);
          return (
            <label className="radio payment-option" key={method}>
              <input
                type="radio"
                name="method"
                checked={draft.method === method}
                onChange={() =>
                  setDraft((d) => ({ ...d, order: undefined, method }))
                }
              />
              <span>
                <strong>
                  {method} · {money(total.known)}
                  {total.pending ? " + a confirmar" : ""}
                </strong>
                <span className="field-help">
                  Total ilustrativo de {draft.items.length}{" "}
                  {draft.items.length === 1 ? "corrida" : "corridas"}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>
      <OrderSummary items={draft.items} method={draft.method} />
      <div className="soft inset">
        <h3>{draft.method} demonstrativo</h3>
        <p>
          {draft.method === "Pix"
            ? "Sem chave, QR Pix ou código copiável. Não realize transferência."
            : "Não informe dados de cartão. Não há formulário bancário ou processamento de crédito."}
        </p>
        <strong>Nenhuma transação será realizada ou confirmada.</strong>
      </div>
    </>
  );
}
