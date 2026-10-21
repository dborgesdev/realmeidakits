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
        Pessoa responsável: {draft.responsible.name} · {draft.responsible.email}
      </p>

      {draft.participants.map((p) => (
        <section className="form-section" key={p.id}>
          <h2>{p.person.name}</h2>
          <p>
            {p.person.cpf} · {p.person.birthDate} · {p.person.phone}
          </p>
          <OrderSummary items={p.items} method={draft.method} />
          <p className="success">
            ✓ Documentos demonstrativos completos e condições aceitas para cada
            corrida.
          </p>
        </section>
      ))}
      <nav
        className="review-actions"
        aria-label="Editar pedido antes de finalizar"
      >
        <Link className="button secondary" to="/solicitacao/responsavel">
          Editar pessoa responsável
        </Link>
        <Link className="button secondary" to="/solicitacao/participantes">
          Editar participantes
        </Link>
        <Link className="button secondary" to="/solicitacao/documentos">
          Rever documentos
        </Link>
        <Link className="button secondary" to="/solicitacao/condicoes">
          Rever condições
        </Link>
      </nav>
      <p className="notice">
        Após finalizar, este pedido ficará bloqueado. Nenhuma cobrança, reserva
        ou análise documental será realizada.
      </p>
    </>
  );
}
