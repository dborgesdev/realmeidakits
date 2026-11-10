import RaceSelectionButton from "../RaceSelectionButton";
import { useCatalog } from "../../state/CatalogContext";

export default function RequestRacePicker() {
  const { events } = useCatalog();
  return (
    <details className="request-race-picker">
      <summary className="text-link">Alterar corridas selecionadas</summary>
      <div className="panel">
        <ul className="request-race-list">
          {events.map((race) => (
            <li key={race.id}>
              <strong>{race.name}</strong>
              <RaceSelectionButton event={race} />
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
