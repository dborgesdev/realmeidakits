import { Link } from "react-router-dom";
import { events } from "../../data/events";
import EventCard from "../EventCard";
export default function Events() {
  return (
    <section className="container section" id="corridas">
      <div className="section-heading">
        <div>
          <span className="eyebrow">O PRIMEIRO PASSO É SEU</span>
          <h2>Encontre sua próxima corrida</h2>
          <p>Escolha um evento e experimente a solicitação de retirada.</p>
        </div>
        <Link className="text-link" to="/corridas">
          Ver todas as corridas →
        </Link>
      </div>
      <div className="grid three">
        {events.map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>
      <p className="caption">
        Eventos e imagens conceituais para demonstração. Não representam
        corridas confirmadas.
      </p>
    </section>
  );
}
