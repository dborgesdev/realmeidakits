import { useState, useRef } from "react";
import {
  formatIdentity,
  maskIdentityInput,
  maskedField,
  normalizeIdentity,
} from "../../state/identityMasks";
import type { Person } from "../../types/domain";
import {
  personError,
  validCpf,
  validEmail,
  validPhone,
} from "../../state/identityRules";
export const emptyPerson = (): Person => ({
  name: "",
  cpf: "",
  birthDate: "",
  phone: "",
  email: "",
});
const fields = [
  { key: "name", label: "Nome completo", type: "text" },
  { key: "cpf", label: "CPF", type: "text" },
  { key: "birthDate", label: "Data de nascimento", type: "text" },
  { key: "phone", label: "Telefone com DDD", type: "tel" },
  { key: "email", label: "E-mail", type: "email" },
] as const;
export default function PersonForm({
  initial,
  onSave,
  label,
  owner = false,
}: {
  initial: Person;
  onSave: (person: Person) => Promise<void>;
  label: string;
  owner?: boolean;
}) {
  const [submitted, setSubmitted] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const message = useRef<HTMLParagraphElement>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    const data = new FormData(e.currentTarget);
    const person = Object.fromEntries(
      fields.map((f) => {
        const value = String(data.get(f.key) || "");
        return [
          f.key,
          maskedField(f.key) ? normalizeIdentity(f.key, value) : value,
        ];
      }),
    ) as Person;
    setSubmitted(person);
    const invalid = personError(person, owner);
    if (invalid) {
      setError(invalid);
      requestAnimationFrame(() => message.current?.focus());
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(person);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      requestAnimationFrame(() => message.current?.focus());
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-section" aria-busy={busy}>
      <div className="form-grid">
        {fields.map((input) => (
          <label key={input.key}>
            {input.label}
            <input
              name={input.key}
              type={input.type}
              required={input.key !== "email" || owner}
              disabled={busy}
              readOnly={owner && (input.key === "cpf" || input.key === "email")}
              maxLength={
                input.key === "name"
                  ? 80
                  : input.key === "email"
                    ? 120
                    : undefined
              }
              inputMode={maskedField(input.key) ? "numeric" : undefined}
              placeholder={input.key === "birthDate" ? "DD/MM/AAAA" : undefined}
              autoComplete={
                {
                  name: "name",
                  cpf: "off",
                  birthDate: "bday",
                  phone: "tel-national",
                  email: "email",
                }[input.key]
              }
              defaultValue={
                maskedField(input.key)
                  ? formatIdentity(input.key, initial[input.key])
                  : initial[input.key]
              }
              aria-invalid={
                !!error &&
                ((input.key === "cpf" && !validCpf(submitted.cpf)) ||
                  (input.key === "phone" && !validPhone(submitted.phone)) ||
                  (input.key === "email" &&
                    (owner || !!submitted.email) &&
                    !validEmail(submitted.email)))
              }
              onInput={(event) => {
                if (maskedField(input.key))
                  maskIdentityInput(input.key, event.currentTarget);
                setSuccess(false);
                setError("");
              }}
            />
          </label>
        ))}
      </div>
      {owner && (
        <p className="field-help">
          CPF e e-mail de acesso são protegidos. Para correção, solicite
          atendimento.
        </p>
      )}
      {error && (
        <p className="error" role="alert" tabIndex={-1} ref={message}>
          {error}
        </p>
      )}
      {success && (
        <p className="success" role="status">
          Dados salvos.
        </p>
      )}
      <button className="button" disabled={busy} type="submit">
        {busy ? "Salvando…" : label}
      </button>
    </form>
  );
}
