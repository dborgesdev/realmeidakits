import { Link } from "react-router-dom";
import { useCatalog } from "../../state/CatalogContext";
import type { PaymentMethod, RaceSelection } from "../../types/domain";
import {
  itemPrice,
  money,
  modalityLabel,
  totalPrice,
} from "../../state/pricing";
export default function OrderSummary({
  items,
  method,
  editable = false,
}: {
  items: RaceSelection[];
  method: PaymentMethod;
  editable?: boolean;
}) {
  const { events } = useCatalog();
  const total = totalPrice(items, events, method);
  return (
    <section className="order-summary" aria-label="Resumo consolidado">
      <div className="order-items">
        {items.map((item) => {
          const race = events.find((r) => r.id === item.raceId)!;
          const price = itemPrice(item, race, method);
          return (
            <article className="order-item" key={item.raceId}>
              <div>
                <h3>{race.name}</h3>
                <p>
                  {modalityLabel(item)} · {item.distance}
                </p>
                {item.modality === "oficial" && item.kitType && (
                  <p>{item.kitType}</p>
                )}
                {item.pickup && <p>{item.pickup}</p>}
                <small>
                  {item.modality === "appai"
                    ? `Matrícula ${item.membership}`
                    : `Inscrição ${item.registration}`}
                </small>
              </div>
              <strong>{price === null ? "A confirmar" : money(price)}</strong>
            </article>
          );
        })}
      </div>
      <div className="order-total">
        <div>
          <span>Total · {method}</span>
          <strong>
            {money(total.known)}
            {total.pending > 0 && " + valores a confirmar"}
          </strong>
        </div>
        <small>
          Valores do serviço de retirada, conforme modalidade e opções.
        </small>
      </div>
      {editable && (
        <Link className="text-link" to="/solicitacao/participantes">
          Alterar corridas, modalidades e opções →
        </Link>
      )}
    </section>
  );
}
