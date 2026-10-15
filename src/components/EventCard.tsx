import { CalendarDays, MapPin } from "lucide-react";
import { asset, type Race } from "../data/events";
import { Action } from "./UI";
export default function EventCard({
  event,
  query = "",
}: {
  event: Race;
  query?: string;
}) {
  return (
    <article className="event-card">
      <div className="event-image">
        <img
          src={asset(event.image)}
          width="640"
          height="480"
          alt={`Imagem conceitual: ${event.name}`}
          loading="lazy"
        />
        <span className="badge">DEMONSTRAÇÃO</span>
      </div>
      <div className="card-body">
        <h3>{event.name}</h3>
        <p className="icon-line">
          <CalendarDays size={17} /> Data a confirmar
        </p>
        <p className="icon-line">
          <MapPin size={17} /> Local a confirmar
        </p>
        <div className="card-bottom">
          <small>Evento ilustrativo</small>
          <Action to={`/corridas/${event.slug}${query}`}>Selecionar</Action>
        </div>
      </div>
    </article>
  );
}
