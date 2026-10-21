import ParticipantPanels from "../participants/ParticipantPanels";
import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
export default function ConditionsStep() {
  const { draft, updateItem } = useDemo();
  return (
    <>
      <h1>Condições de cada corrida</h1>
      <p>
        Leia os exemplos separadamente. Os textos são minutas para validação e
        não representam condições jurídicas definitivas.
      </p>
      <ParticipantPanels
        participants={draft.participants}
        describe={(p) =>
          `${p.items.filter((i) => i.acceptedConditions.length).length} corrida(s) com aceite`
        }
      >
        {(participant) => (
          <>
            {participant.items.map((item) => {
              const race = events.find((r) => r.id === item.raceId)!;
              return (
                <fieldset className="form-section" key={race.id}>
                  <legend>{race.name}</legend>
                  {race.conditions.length ? (
                    race.conditions.map((c) => (
                      <div key={c.id}>
                        <p className="condition-copy">{c.text}</p>
                        <label className="radio">
                          <input
                            type="checkbox"
                            required
                            checked={item.acceptedConditions.includes(c.id)}
                            onChange={(e) =>
                              updateItem(participant.id, race.id, {
                                acceptedConditions: e.target.checked
                                  ? [...item.acceptedConditions, c.id]
                                  : item.acceptedConditions.filter(
                                      (id) => id !== c.id,
                                    ),
                              })
                            }
                          />
                          Li e aceito a condição demonstrativa de {race.name}.
                        </label>
                      </div>
                    ))
                  ) : (
                    <p>Sem condição adicional configurada neste exemplo.</p>
                  )}
                </fieldset>
              );
            })}
          </>
        )}
      </ParticipantPanels>
    </>
  );
}
