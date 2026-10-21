import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { useDemo } from "../../state/DemoContext";
import type { Participant } from "../../types/domain";
export default function DataStep({
  participant,
}: {
  participant: Participant;
}) {
  const { setDraft, draft } = useDemo();
  const { field } = useFlowFeedback();
  const nameId = controlId("name", participant.id),
    birthId = controlId("birthDate", participant.id);
  const person = participant.person;
  return (
    <fieldset className="form-section">
      <legend>Dados pessoais</legend>
      <div className="help-panel">
        Identidade individual: {person.cpf}. Dados preenchidos uma vez para as
        corridas desta pessoa.
      </div>
      <button
        className="text-button"
        type="button"
        onClick={() =>
          setDraft((d) => ({
            ...d,
            participants: d.participants.map((p) =>
              p.id === participant.id
                ? {
                    ...p,
                    person: {
                      ...p.person,
                      name: d.responsible.name,
                      phone: d.responsible.phone,
                    },
                  }
                : p,
            ),
          }))
        }
      >
        Esta pessoa sou eu — usar dados da pessoa responsável
      </button>
      <p className="field-help">
        Copia somente para este participante: {draft.responsible.name}.
      </p>
      <label>
        Nome completo de demonstração
        <input
          {...field(nameId)}
          required
          minLength={3}
          maxLength={80}
          value={person.name}
          autoComplete="off"
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              participants: d.participants.map((p) =>
                p.id === participant.id
                  ? { ...p, person: { ...p.person, name: e.target.value } }
                  : p,
              ),
            }))
          }
        />
      </label>
      <FieldError id={nameId} />
      <div className="form-grid">
        <label>
          CPF demonstrativo
          <input readOnly value={person.cpf} />
        </label>
        <label>
          Nascimento de exemplo
          <input
            {...field(birthId)}
            type="date"
            required
            min="1900-01-01"
            max={new Date().toISOString().slice(0, 10)}
            value={person.birthDate}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                participants: d.participants.map((p) =>
                  p.id === participant.id
                    ? {
                        ...p,
                        person: { ...p.person, birthDate: e.target.value },
                      }
                    : p,
                ),
              }))
            }
          />
        </label>
        <FieldError id={birthId} />
        <label>
          Telefone demonstrativo
          <input readOnly value={person.phone} />
        </label>
      </div>
      <p className="field-help">
        Não informe CPF, RG ou documentos reais. Não há busca de identidade
        nesta prévia.
      </p>
    </fieldset>
  );
}
