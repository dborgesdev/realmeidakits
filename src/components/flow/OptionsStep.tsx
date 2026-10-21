import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { money, itemPrice } from "../../state/pricing";
import type { Modality, RaceSelection } from "../../types/domain";
export default function OptionsStep({
  participantId,
  items,
}: {
  participantId: string;
  items: RaceSelection[];
}) {
  const { draft, updateItem: editItem, assign } = useDemo();
  const { field } = useFlowFeedback();
  const updateItem = (id: string, patch: Partial<RaceSelection>) =>
    editItem(participantId, id, patch);
  return (
    <>
      <h3 className="subsection-title">Opções de cada corrida</h3>
      <p>
        Você pode combinar modalidades e distâncias. Os dados pessoais serão
        preenchidos uma única vez.
      </p>
      {items.map((item) => {
        const race = events.find((r) => r.id === item.raceId)!;
        const mode = race.modalities.find((m) => m.id === item.modality)!;
        const price = itemPrice(item, race, draft.method);
        return (
          <fieldset className="form-section race-section" key={race.id}>
            <legend>{race.name}</legend>
            <span className="badge">CORRIDA ILUSTRATIVA</span>
            <button
              className="text-button remove-race"
              type="button"
              onClick={() => assign(participantId, race)}
              aria-label={`Remover ${race.name}`}
            >
              Remover corrida
            </button>
            <label>
              Modalidade
              <select
                {...field(controlId("modality", participantId, race.id))}
                aria-label={`Modalidade — ${race.name}`}
                value={item.modality}
                onChange={(e) =>
                  updateItem(race.id, { modality: e.target.value as Modality })
                }
              >
                {race.modalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <FieldError id={controlId("modality", participantId, race.id)} />
            </label>
            <div className="form-grid">
              <label>
                Distância
                <select
                  required
                  {...field(controlId("distance", participantId, race.id))}
                  aria-label={`Distância — ${race.name}`}
                  value={item.distance}
                  onChange={(e) =>
                    updateItem(race.id, { distance: e.target.value })
                  }
                >
                  <option value="">Selecione a distância</option>
                  {race.distances.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <FieldError
                  id={controlId("distance", participantId, race.id)}
                />
              </label>
              {item.modality === "oficial" && race.kitTypes.length > 0 && (
                <label>
                  Tipo de kit
                  <select
                    required
                    {...field(controlId("kitType", participantId, race.id))}
                    aria-label={`Tipo de kit — ${race.name}`}
                    value={item.kitType}
                    onChange={(e) =>
                      updateItem(race.id, { kitType: e.target.value })
                    }
                  >
                    <option value="">Selecione seu kit</option>
                    {race.kitTypes.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                  <FieldError
                    id={controlId("kitType", participantId, race.id)}
                  />
                </label>
              )}
            </div>
            {item.modality === "appai" && (
              <>
                <fieldset>
                  <legend>Opção APPAI</legend>
                  <label className="radio">
                    <input
                      type="radio"
                      name={`kit-${participantId}-${race.id}`}
                      checked={item.kit === "camiseta"}
                      onChange={() => updateItem(race.id, { kit: "camiseta" })}
                    />
                    Camiseta com número de peito
                  </label>
                  <label className="radio">
                    <input
                      type="radio"
                      name={`kit-${participantId}-${race.id}`}
                      checked={item.kit === "numero"}
                      onChange={() => updateItem(race.id, { kit: "numero" })}
                    />
                    Somente número de peito
                  </label>
                </fieldset>
                {item.kit === "camiseta" && (
                  <label>
                    Tamanho da camiseta
                    <select
                      required
                      {...field(controlId("size", participantId, race.id))}
                      aria-label={`Tamanho da camiseta — ${race.name}`}
                      value={item.size}
                      onChange={(e) =>
                        updateItem(race.id, { size: e.target.value })
                      }
                    >
                      <option value="">Selecione um tamanho</option>
                      {mode.sizes.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <FieldError
                      id={controlId("size", participantId, race.id)}
                    />
                    <span className="field-help">
                      Grade ilustrativa específica desta corrida.
                    </span>
                  </label>
                )}
              </>
            )}
            {race.pickupLocations.length > 0 && (
              <label>
                Local de retirada
                <select
                  required
                  {...field(controlId("pickup", participantId, race.id))}
                  aria-label={`Local de retirada — ${race.name}`}
                  value={item.pickup}
                  onChange={(e) =>
                    updateItem(race.id, { pickup: e.target.value })
                  }
                >
                  <option value="">Selecione o local</option>
                  {race.pickupLocations.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <FieldError id={controlId("pickup", participantId, race.id)} />
              </label>
            )}
            <p className="item-price">
              {price === null ? "Valor a confirmar" : money(price)}{" "}
              <small>· exemplo no {draft.method}, sem cobrança</small>
            </p>
          </fieldset>
        );
      })}
    </>
  );
}
