import { Link } from "react-router-dom";
import { events } from "../../data/events";
import { previewConfig } from "../../config/preview";
import { useDemo } from "../../state/DemoContext";
import { participantReady } from "../../state/requestRules";
import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { isAvailable } from "../../state/selectionRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import DataStep from "./DataStep";
import OptionsStep from "./OptionsStep";
import RaceFields from "./RaceFields";
export default function ParticipantsStep() {
  const { draft, resize, remove, assign } = useDemo();
  const { field, navigatePanel } = useFlowFeedback();
  const complete = draft.participants.filter((p) =>
    participantReady(p, events, draft.selectedRaceIds),
  ).length;
  return (
    <>
      <h1>Dados dos participantes</h1>
      <p>
        Abra uma pessoa por vez. Atribua somente as corridas em que ela
        participa.
      </p>
      <div className="participant-toolbar">
        <span aria-live="polite">
          {complete} de {draft.participants.length} participantes configurados
        </span>
        <button
          type="button"
          className="button secondary small"
          disabled={draft.participants.length >= previewConfig.maxParticipants}
          onClick={() => {
            resize(draft.participants.length + 1);
            navigatePanel(`p${draft.nextParticipantNumber}`);
          }}
        >
          Adicionar participante
        </button>
      </div>
      {draft.participants.length >= previewConfig.maxParticipants && (
        <p className="caption">
          Limite de {previewConfig.maxParticipants} participantes atingido.
        </p>
      )}
      <ParticipantPanels
        participants={draft.participants}
        describe={(p) =>
          participantReady(p, events, draft.selectedRaceIds)
            ? `✓ Completo · ${p.items.length} corrida(s) configurada(s)`
            : `! Dados ou opções pendentes · ${p.items.length} corrida(s)`
        }
      >
        {(p, next) => (
          <>
            <DataStep participant={p} />
            <fieldset
              className="form-section"
              {...field(controlId("races", p.id))}
              tabIndex={-1}
            >
              <legend>Corridas deste participante</legend>
              <FieldError id={controlId("races", p.id)} />
              {events
                .filter((r) => draft.selectedRaceIds.includes(r.id))
                .map((r) => (
                  <label className="radio" key={r.id}>
                    <input
                      type="checkbox"
                      checked={p.items.some((i) => i.raceId === r.id)}
                      disabled={!isAvailable(r)}
                      onChange={() => assign(p.id, r)}
                    />
                    {r.name}
                  </label>
                ))}
              <p className="field-help">
                Sem duplicar a combinação de participante e corrida.
              </p>
              <Link className="text-link" to="/corridas">
                Escolher outras corridas no catálogo
              </Link>
            </fieldset>
            <OptionsStep participantId={p.id} items={p.items} />
            {p.items.map((item) => (
              <fieldset className="form-section" key={item.raceId}>
                <legend>
                  Identificação na prova ·{" "}
                  {events.find((r) => r.id === item.raceId)!.name}
                </legend>
                <RaceFields
                  participantId={p.id}
                  item={item}
                  race={events.find((r) => r.id === item.raceId)!}
                />
              </fieldset>
            ))}
            <div className="participant-toolbar">
              {next && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={next}
                >
                  Próximo participante
                </button>
              )}
              <button
                type="button"
                className="text-button"
                disabled={draft.participants.length === 1}
                onClick={() => remove(p.id)}
                aria-label={`Remover participante ${p.person.name}`}
              >
                Remover participante
              </button>
            </div>
          </>
        )}
      </ParticipantPanels>
    </>
  );
}
