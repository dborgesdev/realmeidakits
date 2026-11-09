import { CalendarDays, MapPin, Check, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { asset } from "../data/assets";
import type { Race } from "../types/domain";
import { useRequest } from "../state/RequestContext";
import { availabilityLabel, isAvailable } from "../state/selectionRules";
import RaceImage from "./RaceImage";
export default function EventCard({ event }: { event: Race }) {
  const { draft, toggleRace } = useRequest();
  const selected = !draft.order && draft.selectedRaceIds.includes(event.id);
  const available = isAvailable(event);
  return (
    <article className={`event-card ${selected ? "is-selected" : ""}`}>
      <div className="event-image">
        {event.image ? (
          <RaceImage
            src={asset(event.image)}
            width="640"
            height="480"
            alt={`Imagem: ${event.name}`}
            loading="lazy"
          />
        ) : (
          <div className="event-image-missing">Imagem ainda não cadastrada</div>
        )}
      </div>
      <div className="card-body">
        <h3>{event.name}</h3>
        <span className={`availability ${available ? "available" : "closed"}`}>
          {availabilityLabel(event)}
        </span>
        <p className="icon-line">
          <CalendarDays size={17} />
          {event.raceDate
            ? `${new Date(event.raceDate + "T12:00:00").toLocaleDateString("pt-BR")}`
            : "Data a confirmar"}
        </p>
        {event.closesAt && (
          <p className="caption">
            Prazo:{" "}
            {new Date(event.closesAt).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            (Brasília)
          </p>
        )}
        <p className="icon-line">
          <MapPin size={17} />
          {event.location || "Local a confirmar"}
        </p>
        <p className="caption">
          {event.modalities.map((m) => m.label).join(" · ")}
        </p>
        <div className="card-selection">
          <button
            type="button"
            className={`button ${selected ? "secondary" : ""}`}
            disabled={!available && !selected}
            aria-pressed={selected}
            aria-label={`${selected ? "Remover" : "Selecionar"} ${event.name}`}
            onClick={() => toggleRace(event)}
          >
            {selected ? <Check size={18} /> : <Plus size={18} />}{" "}
            {selected
              ? "Selecionada · remover"
              : available
                ? "Selecionar corrida"
                : "Seleção encerrada"}
          </button>
          <Link className="text-link" to={`/corridas/${event.slug}`}>
            Conhecer corrida →
          </Link>
        </div>
      </div>
    </article>
  );
}
