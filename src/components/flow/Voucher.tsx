import { useState } from "react";
import { Link } from "react-router-dom";
import type { DemoOrder, RaceSelection, Participant } from "../../types/domain";
import { findRace } from "../../data/events";
import { modalityLabel } from "../../state/pricing";
import { voucherId } from "../../state/participantRules";
import { downloadVoucher } from "../../state/voucherPdf";
import { groupUrl } from "../../state/voucherRules";
export default function Voucher({
  order,
  participant,
  item,
}: {
  order: DemoOrder;
  participant: Participant;
  item: RaceSelection;
}) {
  const race = findRace(item.raceId)!;
  const [error, setError] = useState("");
  const group = groupUrl(race);
  async function download() {
    setError("");
    try {
      await downloadVoucher(order, participant, item, race);
    } catch {
      setError(
        "Não foi possível gerar o PDF. Tente novamente quando a marca estiver carregada.",
      );
    }
  }
  return (
    <section
      className="demo-voucher"
      aria-label={`Voucher de ${participant.person.name} — ${race.name}`}
    >
      <div className="voucher-top">
        <img
          src="/brand/logo-corredor-original.jpg"
          alt="Re Almeida Kits"
          width="140"
          height="54"
        />
        <span className="badge">DEMONSTRAÇÃO — SEM VALIDADE</span>
      </div>
      <div className="voucher-content">
        <div>
          <span className="eyebrow">VOUCHER DE RETIRADA</span>
          <h3>{race.name}</h3>
          <dl className="summary">
            <dt>Voucher</dt>
            <dd>{voucherId(participant.id, race.id)}</dd>
            <dt>Pedido</dt>
            <dd>{order.id}</dd>
            <dt>Participante fictício</dt>
            <dd>
              {participant.person.name} · {participant.person.cpf}
            </dd>
            <dt>Modalidade / distância</dt>
            <dd>
              {modalityLabel(item)} · {item.distance}
            </dd>
            <dt>Kit / tamanho</dt>
            <dd>
              {item.modality === "appai"
                ? item.kit === "numero"
                  ? "Somente número de peito"
                  : `Camiseta ${item.size}`
                : item.kitType || "Kit oficial"}
            </dd>
            <dt>Retirada</dt>
            <dd>{item.pickup || "Local a confirmar"}</dd>
          </dl>
          <p>{race.guidance}</p>
        </div>
        <div className="voucher-invalid">
          <strong>SEM QR CODE</strong>
          <span>Não permite leitura ou retirada.</span>
        </div>
      </div>
      <p className="voucher-warning">
        DEMONSTRAÇÃO — SEM VALIDADE. Não é comprovante de pagamento, inscrição
        ou retirada. Nenhuma reserva ou operação foi realizada.
      </p>
      <div className="voucher-actions">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" className="button secondary" onClick={download}>
            Baixar PDF
          </button>
          {group && (
            <a
              className="button secondary"
              href={group}
              target="_blank"
              rel="noopener noreferrer"
            >
              Entrar no grupo de WhatsApp
            </a>
          )}
          <Link className="text-link" to="/acompanhamento">
            Acompanhar pedido
          </Link>
        </div>
        <p className="field-help">
          PDF ilustrativo gerado neste navegador, sem validade para retirada.{" "}
          {!group && "Grupo ainda não disponibilizado para esta corrida."}
        </p>
      </div>
    </section>
  );
}
