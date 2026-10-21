import { Link } from "react-router-dom";
import { events } from "../../data/events";
import EventCard from "../EventCard";
import SelectionSummary from "../selection/SelectionSummary";
export default function Events() {
  return (
    <section className="container section" id="corridas">
      <div className="section-heading">
        <div>
          <span className="eyebrow">O PRIMEIRO PASSO É SEU</span>
          <h2>Encontre sua próxima corrida</h2>
          <p>
            Selecione uma ou várias corridas. Uma participante, um pagamento
            demonstrativo.
          </p>
        </div>
        <Link className="text-link" to="/corridas">
          Ver todas as corridas →
        </Link>
      </div>
      <div className="grid three">
        {events.slice(0, 3).map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>
      <SelectionSummary />
      <p className="caption">
        Eventos e imagens conceituais para demonstração. Não representam
        corridas confirmadas.
      </p>
    </section>
  );
}
