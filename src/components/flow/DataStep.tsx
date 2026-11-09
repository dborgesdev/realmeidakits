import { useState } from "react";
import { useAccount } from "../../state/AccountContext";
import { personError } from "../../state/identityRules";
import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { useRequest } from "../../state/RequestContext";
import type { Participant, Person } from "../../types/domain";
export default function DataStep({
  participant,
}: {
  participant: Participant;
}) {
  const account = useAccount();
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const { setDraft, draft } = useRequest();
  const { field } = useFlowFeedback();
  const edit = (key: keyof Person, value: string) =>
    setDraft((d) => ({
      ...d,
      participants: d.participants.map((p) =>
        p.id === participant.id
          ? { ...p, person: { ...p.person, [key]: value } }
          : p,
      ),
    }));
  async function save() {
    const invalid = personError(participant.person);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const current = account.participants.find(
        (p) => p.id === participant.directoryId,
      );
      const saved = await account.saveParticipant(
        participant.person,
        current?.id,
        participant.directoryVersion,
      );
      setDraft((d) => ({
        ...d,
        participants: d.participants.map((p) =>
          p.id === participant.id
            ? {
                ...p,
                person: saved.person,
                directoryId: saved.id,
                directoryVersion: saved.version,
              }
            : p,
        ),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <fieldset className="form-section">
      <legend>Dados pessoais</legend>
      <label>
        Usar participante cadastrado
        <select
          value={participant.directoryId ?? ""}
          onChange={(e) => {
            const saved = account.participants.find(
              (p) => p.id === Number(e.target.value),
            );
            if (saved)
              setDraft((d) => ({
                ...d,
                participants: d.participants.map((p) =>
                  p.id === participant.id
                    ? {
                        ...p,
                        person: saved.person,
                        directoryId: saved.id,
                        directoryVersion: saved.version,
                      }
                    : p,
                ),
              }));
          }}
        >
          <option value="">Selecione um cadastro</option>
          {account.participants.map((p) => (
            <option
              key={p.id}
              value={p.id}
              disabled={draft.participants.some(
                (other) =>
                  other.id !== participant.id && other.directoryId === p.id,
              )}
            >
              {p.person.name} · CPF final {p.person.cpf.slice(-4)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="text-button"
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
                      email: d.responsible.email,
                      cpf: account.profile?.cpf ?? "",
                      birthDate: account.profile?.birthDate ?? "",
                    },
                  }
                : p,
            ),
          }))
        }
      >
        Esta pessoa sou eu — usar dados da pessoa responsável
      </button>
      {(
        [
          { key: "name", label: "Nome completo", type: "text" },
          { key: "cpf", label: "CPF", type: "text" },
          { key: "birthDate", label: "Data de nascimento", type: "date" },
          { key: "phone", label: "Telefone", type: "tel" },
          { key: "email", label: "E-mail", type: "email" },
        ] as const
      ).map((input) => {
        const id = controlId(input.key, participant.id);
        return (
          <label key={input.key}>
            {input.label}
            <input
              {...field(id)}
              type={input.type}
              required={input.key !== "email"}
              maxLength={
                input.key === "cpf" ? 14 : input.key === "name" ? 80 : 120
              }
              min={input.key === "birthDate" ? "1900-01-01" : undefined}
              max={
                input.key === "birthDate"
                  ? new Date().toISOString().slice(0, 10)
                  : undefined
              }
              value={participant.person[input.key]}
              onChange={(e) => edit(input.key, e.target.value)}
            />
            <FieldError id={id} />
          </label>
        );
      })}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        {...field(controlId("save-person", participant.id))}
        type="button"
        className="button secondary"
        disabled={saving}
        onClick={save}
      >
        {saving ? "Salvando…" : "Salvar cadastro do participante"}
      </button>
      <FieldError id={controlId("save-person", participant.id)} />
      <p className="field-help">
        Dados preenchidos uma vez para as corridas desta pessoa.
        {draft.responsible.name
          ? ` Responsável: ${draft.responsible.name}.`
          : ""}
      </p>
    </fieldset>
  );
}
