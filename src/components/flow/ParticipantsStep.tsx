import { Link } from "react-router-dom";
import { events } from "../../data/events";
import { previewConfig } from "../../config/preview";
import { useDemo } from "../../state/DemoContext";
import {
  participantReady,
  participantDocumentsReady,
} from "../../state/requestRules";
import { isAvailable } from "../../state/selectionRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import DataStep from "./DataStep";
import OptionsStep from "./OptionsStep";
import RaceFields from "./RaceFields";
export default function ParticipantsStep() {
  const { draft, resize, remove, assign } = useDemo();
  const complete = draft.participants.filter((p) =>
    participantReady(p, events, draft.selectedRaceIds),
  ).length;
  return (
    <>
      <h1>Cada participante, suas escolhas</h1>
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
          onClick={() => resize(draft.participants.length + 1)}
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
          `${participantReady(p, events, draft.selectedRaceIds) ? "✓ Dados e opções completos" : "Dados ou opções pendentes"} · ${p.items.length} corrida(s) · ${participantDocumentsReady(p, events) && p.items.length ? "documentos prontos" : "documentos pendentes"}`
        }
      >
        {(p, next) => (
          <>
            <DataStep participant={p} />
            <fieldset className="form-section">
              <legend>Corridas desta pessoa</legend>
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
              <button
                type="button"
                className="button secondary small"
                onClick={next}
              >
                Próxima participante
              </button>
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
