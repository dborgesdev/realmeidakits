import { Link } from "react-router-dom";
import { events } from "../../data/events";
import { totalPrice, money } from "../../state/pricing";
import { useDemo } from "../../state/DemoContext";
import OrderSummary from "./OrderSummary";
export default function ReviewStep() {
  const { draft } = useDemo();
  const total = totalPrice(
    draft.participants.flatMap((p) => p.items),
    events,
    draft.method,
  );
  return (
    <>
      <h1>Confira seu pedido</h1>
      <p className="help-panel">
        Total demonstrativo do pedido · {draft.method}:{" "}
        <strong>
          {money(total.known)}
          {total.pending ? " + a confirmar" : ""}
        </strong>
      </p>
      <p>
        Responsável: {draft.responsible.name} · {draft.responsible.email}
      </p>
      <Link to="/solicitacao/responsavel">Editar responsável</Link>
      {draft.participants.map((p) => (
        <section className="form-section" key={p.id}>
          <h2>{p.person.name}</h2>
          <p>
            {p.person.cpf} · {p.person.birthDate} · {p.person.phone}
          </p>
          <OrderSummary items={p.items} method={draft.method} editable />
          <p className="success">
            ✓ Documentos demonstrativos completos e condições aceitas para cada
            corrida.
          </p>
        </section>
      ))}
      <div className="actions">
        <Link to="/solicitacao/participantes">Editar pessoas e corridas</Link>
        <Link to="/solicitacao/documentos">Rever documentos</Link>
        <Link to="/solicitacao/condicoes">Rever condições</Link>
      </div>
      <p className="notice">
        Após finalizar, este pedido ficará bloqueado. Nenhuma cobrança, reserva
        ou análise documental será realizada.
      </p>
    </>
  );
}
