import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { selectionEstimate, money, totalPrice } from "../../state/pricing";
import { participantReady } from "../../state/requestRules";
import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
export default function SelectionSummary() {
  const { draft } = useDemo();
  const configured =
    draft.prepared &&
    draft.participants.every((p) =>
      participantReady(p, events, draft.selectedRaceIds),
    );
  const estimate = configured
    ? totalPrice(
        draft.participants.flatMap((p) => p.items),
        events,
        draft.method,
      )
    : selectionEstimate(
        events.filter((r) => draft.selectedRaceIds.includes(r.id)),
        draft.method,
      );
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      document.body.style.setProperty(
        "--selection-space",
        `${el.offsetHeight + 24}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => {
      observer.disconnect();
      document.body.style.removeProperty("--selection-space");
    };
  }, [draft.selectedRaceIds.length, draft.order]);
  if (!draft.selectedRaceIds.length || draft.order) return null;
  return (
    <aside
      ref={ref}
      className="selection-summary"
      aria-label="Corridas selecionadas"
    >
      <div>
        <strong aria-live="polite">
          {draft.selectedRaceIds.length} corrida(s) selecionada(s)
        </strong>
        <small className="selection-estimate">
          {configured ? "Total simulado" : "Referência a partir de"}{" "}
          {money(estimate.known)}
          {estimate.pending ? " + a confirmar" : ""} · demonstração
        </small>
        <details>
          <summary>Ver seleção e estimativa</summary>
          <p>
            {configured ? "Total simulado" : "Referência a partir de"}{" "}
            {money(estimate.known)}
            {estimate.pending ? " + valores a confirmar" : ""} · exemplo no{" "}
            {draft.method}.{" "}
            {configured
              ? "Calculado com os participantes e opções deste pedido."
              : "Referência de uma pessoa por corrida. O total será calculado conforme participantes e opções."}
          </p>
          <ul>
            {events
              .filter((r) => draft.selectedRaceIds.includes(r.id))
              .map((r) => (
                <li key={r.id}>{r.name}</li>
              ))}
          </ul>
        </details>
      </div>
      <Link className="button" to="/solicitacao/pedido">
        Finalizar inscrição →
      </Link>
    </aside>
  );
}
