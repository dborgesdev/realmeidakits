import { useEffect, useState, type ReactNode } from "react";
import type { Participant } from "../../types/domain";
import { focusControl, useFlowFeedback } from "../flow/FlowFeedback";
export default function ParticipantPanels({
  participants,
  describe,
  children,
}: {
  participants: Participant[];
  describe: (p: Participant) => string;
  children: (p: Participant, next: (() => void) | undefined) => ReactNode;
}) {
  const [active, setActive] = useState(participants[0]?.id || "");
  const { issue, validationParticipantId, navigation, navigatePanel, clear } =
    useFlowFeedback();
  const requested = validationParticipantId || navigation?.participantId;
  const selected =
    requested && participants.some((p) => p.id === requested)
      ? requested
      : participants.some((p) => p.id === active)
        ? active
        : active
          ? participants[0]?.id
          : "";
  useEffect(() => {
    if (!navigation || issue) return;
    const frame = requestAnimationFrame(() =>
      focusControl(`participant-heading-${navigation.participantId}`),
    );
    return () => cancelAnimationFrame(frame);
  }, [navigation, issue]);
  return (
    <div className="participant-panels">
      {participants.map((p, index) => {
        const open = selected === p.id;
        const next = participants[index + 1];
        return (
          <section
            className={`participant-panel ${open ? "is-open" : ""}`}
            key={p.id}
          >
            <h2>
              <button
                id={`participant-heading-${p.id}`}
                type="button"
                className="participant-toggle"
                aria-expanded={open}
                aria-controls={`panel-${p.id}`}
                onClick={() => {
                  clear();
                  setActive(open ? "" : p.id);
                }}
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
                {children(p, next ? () => navigatePanel(next.id) : undefined)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
