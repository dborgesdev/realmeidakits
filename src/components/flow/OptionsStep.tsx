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
              Modalidade — {race.name}
              <select
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
            </label>
            <div className="form-grid">
              <label>
                Distância — {race.name}
                <select
                  required
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
              </label>
              {item.modality === "oficial" && race.kitTypes.length > 0 && (
                <label>
                  Kit adquirido — {race.name}
                  <select
                    required
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
                </label>
              )}
            </div>
            {item.modality === "appai" && (
              <>
                <fieldset>
                  <legend>Opção APPAI — {race.name}</legend>
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
                    Tamanho da camiseta — {race.name}
                    <select
                      required
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
                    <span className="field-help">
                      Grade ilustrativa específica desta corrida.
                    </span>
                  </label>
                )}
              </>
            )}
            {race.pickupLocations.length > 0 && (
              <label>
                Local de retirada — {race.name}
                <select
                  required
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
