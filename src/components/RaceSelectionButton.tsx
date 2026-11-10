import { Check, Plus } from "lucide-react";
import type { Race } from "../types/domain";
import { useRequest } from "../state/RequestContext";
import { isAvailable } from "../state/selectionRules";

export default function RaceSelectionButton({ event }: { event: Race }) {
  const { draft, toggleRace } = useRequest();
  const selected = !draft.order && draft.selectedRaceIds.includes(event.id);
  const available = isAvailable(event);
  return (
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
  );
}
