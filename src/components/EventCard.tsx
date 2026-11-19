import { CalendarDays, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { asset } from "../data/assets";
import type { Race } from "../types/domain";
import { useRequest } from "../state/RequestContext";
import { availabilityLabel, isAvailable } from "../state/selectionRules";
import RaceSelectionButton from "./RaceSelectionButton";
import RaceImage from "./RaceImage";
export default function EventCard({ event }: { event: Race }) {
  const { draft } = useRequest();
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
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="event-image-missing">Imagem ainda não cadastrada</div>
        )}
      </div>
      <div className="card-body">
        <h3>
          <Link
            className="event-card-link"
            reloadDocument
            to={`/corridas/${event.slug}`}
          >
            {event.name}
          </Link>
        </h3>
        <span className={`availability ${available ? "available" : "closed"}`}>
          {availabilityLabel(event)}
        </span>
        <p className="icon-line">
          <CalendarDays size={19} aria-hidden="true" />
          {event.raceDate
            ? `${new Date(event.raceDate + "T12:00:00").toLocaleDateString("pt-BR")}`
            : "Data a confirmar"}
          {event.raceTime && ` · ${event.raceTime}`}
        </p>
        <p className="icon-line">
          <MapPin size={19} aria-hidden="true" />
          {event.location || "Local a confirmar"}
        </p>
        {event.modalities.length > 0 && (
          <p className="icon-line">
            <PackageCheck size={19} aria-hidden="true" />
            {event.modalities.map((m) => m.label).join(" · ")}
          </p>
        )}
        <div className="card-selection">
          <RaceSelectionButton event={event} />
        </div>
      </div>
    </article>
  );
}
