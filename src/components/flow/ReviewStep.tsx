import { Link } from "react-router-dom";
import { formatIdentity } from "../../state/identityMasks";
import { useCatalog } from "../../state/CatalogContext";
import { totalPrice, money } from "../../state/pricing";
import { useRequest } from "../../state/RequestContext";
import OrderSummary from "./OrderSummary";
export default function ReviewStep() {
  const { events } = useCatalog();
  const { draft } = useRequest();
  const total = totalPrice(
    draft.participants.flatMap((p) => p.items),
    events,
  );
  return (
    <>
      <h1>Confira seu pedido</h1>
      <p className="help-panel">
        Total do serviço{" "}
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
            {formatIdentity("cpf", p.person.cpf)} ·{" "}
            {formatIdentity("birthDate", p.person.birthDate)} ·{" "}
            {formatIdentity("phone", p.person.phone)}
          </p>
          <OrderSummary items={p.items} />
          <p className="field-help">Solicitação ainda não enviada.</p>
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
    </>
  );
}
