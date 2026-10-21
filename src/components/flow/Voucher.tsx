import { Ban, Ticket } from "lucide-react";
import type { DemoOrder, RaceSelection } from "../../types/domain";
import { findRace } from "../../data/events";
import { modalityLabel } from "../../state/pricing";
export default function Voucher({
  order,
  item,
}: {
  order: DemoOrder;
  item: RaceSelection;
}) {
  const race = findRace(item.raceId)!;
  return (
    <section
      className="demo-voucher"
      aria-label={`Voucher ilustrativo de ${race.name}`}
    >
      <div className="voucher-top">
        <img
          src="/brand/logo-corredor-original.jpg"
          alt="Re Almeida Kits"
          width="140"
          height="54"
        />
        <span className="badge">DEMONSTRAÇÃO · SEM VALIDADE</span>
      </div>
      <div className="voucher-content">
        <div>
          <span className="eyebrow">
            <Ticket size={18} />
            VOUCHER ILUSTRATIVO
          </span>
          <h2>{race.name}</h2>
          <dl className="summary">
            <dt>Voucher</dt>
            <dd>DEMO-VOUCHER-{race.id}</dd>
            <dt>Solicitação</dt>
            <dd>{order.id}</dd>
            <dt>Participante fictícia</dt>
            <dd>{order.person.name} · DEMO-CPF</dd>
            <dt>Modalidade / distância</dt>
            <dd>
              {modalityLabel(item)} · {item.distance}
            </dd>
            <dt>Retirada</dt>
            <dd>{item.pickup || "Local a confirmar"} · Sem agendamento real</dd>
          </dl>
        </div>
        <div className="voucher-invalid">
          <Ban size={48} aria-hidden="true" />
          <strong>SEM QR CODE</strong>
          <span>Não permite leitura ou retirada</span>
        </div>
      </div>
      <p className="voucher-warning">
        NÃO É COMPROVANTE. Voucher identifica a solicitação ilustrativa por
        corrida; número de peito identifica a participante na prova. Não há PDF,
        QR ou validação operacional.
      </p>
    </section>
  );
}
