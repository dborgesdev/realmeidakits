import { Link } from "react-router-dom";
import { useCatalog } from "../../state/CatalogContext";
import EventCard from "../EventCard";
import { isPubliclyListed } from "../../state/selectionRules";
import SelectionSummary from "../selection/SelectionSummary";
export default function Events() {
  const { events } = useCatalog();
  const now = new Date();
  const listed = events.filter((race) => isPubliclyListed(race, now));
  return (
    <section className="container section" id="corridas">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ESCOLHA SUA CORRIDA</span>
          <h2>Encontre sua próxima corrida</h2>
          <p>
            Abra os detalhes da corrida ou selecione para solicitar a retirada.
          </p>
        </div>
        <Link className="text-link" reloadDocument to="/corridas">
          Ver todas as corridas →
        </Link>
      </div>
      <div className="grid three">
        {!listed.length && (
          <p role="status">Nenhuma corrida publicada no momento.</p>
        )}
        {listed.slice(0, 3).map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
      </div>
      <SelectionSummary />
    </section>
  );
}
