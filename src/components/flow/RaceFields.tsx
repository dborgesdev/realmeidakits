import type { Race, RaceSelection } from "../../types/domain";
import { useDemo } from "../../state/DemoContext";
export default function RaceFields({
  race,
  item,
  participantId,
}: {
  participantId: string;
  race: Race;
  item: RaceSelection;
}) {
  const { updateItem: editItem } = useDemo();
  const updateItem = (id: string, patch: Partial<RaceSelection>) =>
    editItem(participantId, id, patch);
  return item.modality === "appai" ? (
    <>
      <label>
        Matrícula APPAI — {race.name}
        <input
          required
          pattern="DEMO-[0-9]{3,6}"
          title="Use DEMO- seguido de 3 a 6 dígitos"
          aria-describedby={`membership-${participantId}-${race.id}`}
          value={item.membership}
          onChange={(e) => updateItem(race.id, { membership: e.target.value })}
        />
      </label>
      <p id={`membership-${participantId}-${race.id}`} className="field-help">
        Informe a matrícula da APPAI, não a matrícula funcional ou de serviço.
        Nesta prévia, use DEMO-101.
      </p>
    </>
  ) : (
    <>
      <label>
        Número do pedido ou inscrição — {race.name}
        <input
          required
          pattern={"DEMO-[A-Z0-9\\-]{3,40}"}
          title="Use um identificador fictício como DEMO-INSCRICAO-001"
          value={item.registration}
          onChange={(e) =>
            updateItem(race.id, { registration: e.target.value })
          }
        />
      </label>
      <p className="field-help">
        Use DEMO-INSCRICAO-001 ou outro marcador DEMO-. Este serviço não vende
        inscrição nem kit.
      </p>
    </>
  );
}
