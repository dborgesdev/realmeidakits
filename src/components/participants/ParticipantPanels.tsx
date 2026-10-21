import { useState, type ReactNode } from "react";
import type { Participant } from "../../types/domain";
export default function ParticipantPanels({
  participants,
  describe,
  children,
}: {
  participants: Participant[];
  describe: (p: Participant) => string;
  children: (p: Participant, next: () => void) => ReactNode;
}) {
  const [active, setActive] = useState(participants[0]?.id || "");
  return (
    <div className="participant-panels">
      {participants.map((p, index) => {
        const open =
          (!active || participants.some((person) => person.id === active)
            ? active
            : participants[0]?.id) === p.id;
        return (
          <section
            className={`participant-panel ${open ? "is-open" : ""}`}
            key={p.id}
          >
            <h2>
              <button
                type="button"
                className="participant-toggle"
                aria-expanded={open}
                aria-controls={`panel-${p.id}`}
                onClick={() => setActive(open ? "" : p.id)}
              >
                <span className="person-number">{index + 1}</span>
                <span>
                  {p.person.name}
                  <small>{describe(p)}</small>
                </span>
                <span aria-hidden="true">{open ? "−" : "+"}</span>
              </button>
            </h2>
            {open && (
              <div id={`panel-${p.id}`} className="participant-body">
                {children(p, () =>
                  setActive(participants[index + 1]?.id || p.id),
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
