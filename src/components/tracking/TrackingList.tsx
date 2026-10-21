import { findRace } from "../../data/events";
import { modalityLabel } from "../../state/pricing";
import {
  trackingItems,
  type TrackingScenario,
} from "../../state/trackingRules";
import type { DemoOrder } from "../../types/domain";
import Voucher from "../flow/Voucher";
export default function TrackingList({
  order,
  scenario,
}: {
  order: DemoOrder;
  scenario: TrackingScenario;
}) {
  return (
    <div className="tracking-list">
      {trackingItems(order, scenario).map((status) => {
        const race = findRace(status.item.raceId)!;
        return (
          <article className="panel tracking-card" key={status.voucherId}>
            <div className="tracking-heading">
              <span className="badge">CORRIDA ILUSTRATIVA</span>
              <h2>{status.participant.person.name}</h2>
              <h3>{race.name}</h3>
              <p>
                {modalityLabel(status.item)} · {status.item.distance}
              </p>
            </div>
            <dl className="tracking-status">
              <div>
                <dt>Pagamento único</dt>
                <dd>{status.payment}</dd>
              </div>
              <div>
                <dt>Documentos</dt>
                <dd>{status.documents}</dd>
              </div>
              <div>
                <dt>Número de peito</dt>
                <dd className={status.bib ? "bib-example" : ""}>
                  {status.bib || "Ainda não informado"}
                </dd>
              </div>
              <div>
                <dt>Disponibilidade do kit</dt>
                <dd>{status.kit}</dd>
              </div>
              <div>
                <dt>Retirada</dt>
                <dd>{status.withdrawal}</dd>
              </div>
            </dl>
            <p className="field-help">
              Número de peito, disponibilidade e retirada são estados
              independentes. Este cenário não registra operações reais.
            </p>
            <details className="voucher-details">
              <summary>Ver voucher de retirada de {race.name}</summary>
              <Voucher
                order={order}
                participant={status.participant}
                item={status.item}
              />
            </details>
          </article>
        );
      })}
    </div>
  );
}
