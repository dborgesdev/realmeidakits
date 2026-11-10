import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import { money, itemPrice } from "../../state/pricing";
import type { Modality, RaceSelection } from "../../types/domain";
import { raceOptions } from "../../state/catalogRules";
import RaceImage from "../RaceImage";
export default function OptionsStep({
  participantId,
  items,
}: {
  participantId: string;
  items: RaceSelection[];
}) {
  const { events } = useCatalog();
  const { updateItem: editItem, assign } = useRequest();
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
        const options = raceOptions(race, item.modality);
        const price = itemPrice(item, race);
        return (
          <fieldset className="form-section race-section" key={race.id}>
            <legend>{race.name}</legend>
            <span className="badge">CONFIGURAÇÃO DA CORRIDA</span>
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
                  {options.distances.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <FieldError
                  id={controlId("distance", participantId, race.id)}
                />
              </label>
              {item.modality === "oficial" && options.kitTypes.length > 0 && (
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
                    {options.kitTypes.map((k) => (
                      <option key={k} value={k}>
                        {k}
                        {mode.kitAdditions?.[k]
                          ? " · +" + money(mode.kitAdditions[k])
                          : ""}
                      </option>
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
                  {mode.shirtEnabled !== false && (
                    <label className="radio">
                      <input
                        type="radio"
                        name={`kit-${participantId}-${race.id}`}
                        checked={item.kit === "camiseta"}
                        onChange={() =>
                          updateItem(race.id, { kit: "camiseta" })
                        }
                      />
                      Camiseta com número de peito
                    </label>
                  )}
                  {mode.numberEnabled !== false && (
                    <label className="radio">
                      <input
                        type="radio"
                        name={`kit-${participantId}-${race.id}`}
                        checked={item.kit === "numero"}
                        onChange={() => updateItem(race.id, { kit: "numero" })}
                      />
                      Somente número de peito
                    </label>
                  )}
                </fieldset>
                {item.kit === "camiseta" && (
                  <>
                    {mode.shirtImage && (
                      <RaceImage
                        src={mode.shirtImage}
                        alt={`Camiseta de ${race.name}`}
                        width="400"
                        height="400"
                        loading="lazy"
                        className="shirt-preview"
                      />
                    )}
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
                        Tamanhos cadastrados para esta corrida.
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
            {options.pickupLocations.length > 0 && (
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
                  {options.pickupLocations.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
                <FieldError id={controlId("pickup", participantId, race.id)} />
              </label>
            )}
            {mode.pickupDetails
              ?.filter((p) => p.label === item.pickup)
              .map((p) => (
                <div className="notice" key={p.id}>
                  <p>{p.address}</p>
                  {p.at && <p>{new Date(p.at).toLocaleString("pt-BR")}</p>}
                  <p>{p.guidance}</p>
                </div>
              ))}
            <p className="item-price" aria-live="polite">
              {price === null ? "Valor a confirmar" : money(price)}{" "}
              <small>· total da modalidade e opções</small>
            </p>
          </fieldset>
        );
      })}
    </>
  );
}
