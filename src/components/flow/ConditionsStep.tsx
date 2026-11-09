import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import {
  acceptCondition,
  conditionVersion,
  conditionsReady,
} from "../../state/conditionRules";
import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
export default function ConditionsStep() {
  const { events } = useCatalog();
  const { draft, setDraft } = useRequest();
  const { field } = useFlowFeedback();
  return (
    <>
      <h1>Condições das corridas</h1>
      <p>
        A pessoa responsável aceita cada condição uma única vez por corrida,
        para todos os participantes vinculados a ela.
      </p>
      {events
        .filter((r) => draft.selectedRaceIds.includes(r.id))
        .map((race) => (
          <fieldset className="form-section" key={race.id}>
            <legend>{race.name}</legend>
            <p>
              {draft.participants
                .filter((p) => p.items.some((i) => i.raceId === race.id))
                .map((p) => p.person.name)
                .join(" · ") || "Ainda sem participante vinculado"}
            </p>
            {race.conditions.map((c, index) => {
              const id = controlId("condition", undefined, race.id, c.id);
              return (
                <section className="condition-section" key={c.id}>
                  <h2>Condição {index + 1}</h2>
                  <p className="condition-copy">{c.text}</p>
                  <label className="radio">
                    <input
                      {...field(id)}
                      type="checkbox"
                      checked={(
                        draft.acceptedConditions[race.id] || []
                      ).includes(conditionVersion(c))}
                      onChange={(e) =>
                        setDraft((d) =>
                          acceptCondition(d, race, c.id, e.target.checked),
                        )
                      }
                    />
                    Li e aceito a condição {index + 1} de {race.name} para os
                    participantes deste pedido.
                  </label>
                  <FieldError id={id} />
                </section>
              );
            })}
            {!race.conditions.length ? (
              <p>Sem condição adicional para esta corrida.</p>
            ) : (
              conditionsReady(draft.acceptedConditions, race) && (
                <p className="success">
                  ✓ Condições completas para esta corrida.
                </p>
              )
            )}
          </fieldset>
        ))}
      <p className="help-panel">
        Este aceite geral não substitui documentos e autorizações individuais
        exigidos pela corrida.
      </p>
    </>
  );
}
