import { CalendarDays, Users } from "lucide-react";
import type { Race } from "../../types/domain";
import RequestRacePicker from "./RequestRacePicker";

export default function RequestIntro({
  races,
  participants,
}: {
  races: Race[];
  participants: number;
}) {
  return (
    <div className="request-intro">
      <p className="request-kicker">Solicitação de retirada de kit</p>
      <p className="request-races">
        <CalendarDays aria-hidden="true" />
        <strong>
          {races.map((race) => race.name).join(" · ") ||
            "Corridas selecionadas"}
        </strong>
      </p>
      <div className="flow-heading">
        <RequestRacePicker />
        <span className="request-count">
          <Users aria-hidden="true" size={20} />
          {participants === 1
            ? "1 participante"
            : `${participants} participantes`}
        </span>
      </div>
    </div>
  );
}
