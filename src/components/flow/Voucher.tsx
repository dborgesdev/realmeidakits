import { Ban, Ticket } from "lucide-react";
import type { Race } from "../../data/events";
import type { Draft } from "../../state/DemoContext";
export default function Voucher({
  event,
  draft,
}: {
  event: Race;
  draft: Draft;
}) {
  return (
    <section className="demo-voucher" aria-labelledby="voucher-title">
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
            <Ticket size={18} /> VOUCHER ILUSTRATIVO
          </span>
          <h2 id="voucher-title">Resumo da experiência</h2>
          <dl className="summary">
            <dt>Corrida de exemplo</dt>
            <dd>{event.name}</dd>
            <dt>Participante fictícia</dt>
            <dd>{draft.name} · DEMO-CPF</dd>
            <dt>Modalidade</dt>
            <dd>
              {draft.modality === "appai"
                ? `APPAI · ${draft.kit === "camiseta" ? `Camiseta ${draft.size} com número de peito` : "Somente número de peito"}`
                : "Kit oficial"}
            </dd>
            <dt>Pagamento</dt>
            <dd>{draft.method} apenas simulado · Nenhuma cobrança</dd>
            <dt>Retirada</dt>
            <dd>Local, data e horário a confirmar na versão funcional</dd>
          </dl>
        </div>
        <div className="voucher-invalid">
          <Ban size={48} aria-hidden="true" />
          <strong>SEM QR CODE</strong>
          <span>Não permite leitura ou retirada</span>
        </div>
      </div>
      <p className="voucher-warning">
        NÃO É COMPROVANTE. Nenhum pedido ou reserva foi criado. PDF, QR válido e
        orientações operacionais dependem da implementação futura.
      </p>
    </section>
  );
}
