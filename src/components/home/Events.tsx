import { Link } from "react-router-dom";
import { useCatalog } from "../../state/CatalogContext";
import EventCard from "../EventCard";
import SelectionSummary from "../selection/SelectionSummary";
export default function Events() {
  const { events } = useCatalog();
  return (
    <section className="container section" id="corridas">
      <div className="section-heading">
        <div>
          <span className="eyebrow">O PRIMEIRO PASSO É SEU</span>
          <h2>Encontre sua próxima corrida</h2>
          <p>Selecione uma ou várias corridas para você ou mais pessoas.</p>
        </div>
        <Link className="text-link" reloadDocument to="/corridas">
          Ver todas as corridas →
        </Link>
      </div>
      <div className="grid three">
        {!events.length && (
          <p role="status">Nenhuma corrida publicada no momento.</p>
        )}
        {events.slice(0, 3).map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>
      <SelectionSummary />
    </section>
  );
}
