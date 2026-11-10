import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import type { Race, RaceSelection } from "../../types/domain";
import { useRequest } from "../../state/RequestContext";
export default function RaceFields({
  race,
  item,
  participantId,
}: {
  participantId: string;
  race: Race;
  item: RaceSelection;
}) {
  const { updateItem: editItem } = useRequest();
  const { field } = useFlowFeedback();
  const updateItem = (id: string, patch: Partial<RaceSelection>) =>
    editItem(participantId, id, patch);
  const mode = race.modalities.find((m) => m.id === item.modality);
  if (
    (item.modality === "appai" && mode?.requireMembership === false) ||
    (item.modality === "oficial" && mode?.requireRegistration === false)
  )
    return (
      <p className="field-help">
        Esta modalidade não exige identificação adicional na prova.
      </p>
    );
  return item.modality === "appai" ? (
    <>
      <label>
        Matrícula APPAI
        <input
          required
          {...field(
            controlId("membership", participantId, race.id),
            `membership-${participantId}-${race.id}`,
          )}
          aria-label={`Matrícula APPAI — ${race.name}`}
          value={item.membership}
          onChange={(e) => updateItem(race.id, { membership: e.target.value })}
        />
      </label>
      <FieldError id={controlId("membership", participantId, race.id)} />
      <p id={`membership-${participantId}-${race.id}`} className="field-help">
        Informe a matrícula da APPAI, não a matrícula funcional ou de serviço.
      </p>
    </>
  ) : (
    <>
      <label>
        Número da inscrição
        <input
          required
          {...field(controlId("registration", participantId, race.id))}
          aria-label={`Número da inscrição — ${race.name}`}
          value={item.registration}
          onChange={(e) =>
            updateItem(race.id, { registration: e.target.value })
          }
        />
      </label>
      <FieldError id={controlId("registration", participantId, race.id)} />
      <p className="field-help">
        Informe o número fornecido pela organização. Este serviço não vende
        inscrição nem kit.
      </p>
    </>
  );
}
