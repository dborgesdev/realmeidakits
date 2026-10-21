import { Link } from "react-router-dom";
import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { money, totalPrice } from "../../state/pricing";
export default function SelectionSummary() {
  const { draft } = useDemo();
  const total = totalPrice(draft.items, events, draft.method);
  return (
    <aside
      className="selection-summary"
      aria-label="Resumo das corridas selecionadas"
    >
      <div aria-live="polite">
        <strong>
          {draft.items.length}{" "}
          {draft.items.length === 1
            ? "corrida selecionada"
            : "corridas selecionadas"}
        </strong>
        <p>
          {draft.items.length
            ? `${money(total.known)}${total.pending ? " + valores a confirmar" : ""} · estimativa demonstrativa no ${draft.method}`
            : "Escolha uma ou várias corridas para a mesma participante."}
        </p>
      </div>
      {draft.items.length ? (
        <Link className="button" to="/solicitacao/configuracao">
          Configurar corridas →
        </Link>
      ) : (
        <span className="caption">Selecione uma corrida para continuar</span>
      )}
    </aside>
  );
}
