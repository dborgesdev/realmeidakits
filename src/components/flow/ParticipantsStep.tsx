import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../state/CatalogContext";
import { useAccount } from "../../state/AccountContext";
import { useRequest } from "../../state/RequestContext";
import { participantReady } from "../../state/requestRules";
import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { isAvailable } from "../../state/selectionRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import DataStep from "./DataStep";
import OptionsStep from "./OptionsStep";
import RaceFields from "./RaceFields";
export default function ParticipantsStep() {
  const { participantLimit, request } = useAccount();
  const { events } = useCatalog();
  const { draft, resize, remove, assign, persistence } = useRequest();
  const [conflicts, setConflicts] = useState<
    { slot: string; raceId: string }[]
  >([]);
  const [lookupError, setLookupError] = useState("");
  useEffect(() => {
    if (persistence.status !== "saved") return;
    let active = true;
    request<{ conflicts: { slot: string; raceId: string }[] }>(
      "/account/draft/registration-conflicts",
      "POST",
      {},
    )
      .then((result) => {
        if (active) {
          setConflicts(result.conflicts);
          setLookupError("");
        }
      })
      .catch(() => {
        if (active)
          setLookupError(
            "A verificação de CPF será repetida antes de finalizar.",
          );
      });
    return () => {
      active = false;
    };
  }, [request, persistence.status, persistence.version]);
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
          disabled={draft.participants.length >= participantLimit}
          onClick={() => {
            resize(draft.participants.length + 1);
            navigatePanel(`p${draft.nextParticipantNumber}`);
          }}
        >
          Adicionar participante
        </button>
      </div>
      {draft.participants.length >= participantLimit && (
        <p className="caption">
          Limite de {participantLimit} participantes atingido.
        </p>
      )}
      {lookupError && <p role="status">{lookupError}</p>}
      {conflicts.map((entry) => {
        const person = draft.participants.find((p) => p.id === entry.slot);
        const race = events.find((event) => event.id === entry.raceId);
        if (
          !person?.items.some((item) => item.raceId === entry.raceId) ||
          !race
        )
          return null;
        return (
          <div className="error" key={entry.slot + ":" + entry.raceId}>
            <p role="alert">
              {person.person.name || "Participante"} já possui uma solicitação
              para {race.name}.
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => assign(person.id, race)}
            >
              Remover apenas esta atribuição
            </button>
          </div>
        );
      })}
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
              <Link className="text-link" reloadDocument to="/corridas">
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
