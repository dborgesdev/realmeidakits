import { useState } from "react";
import { useAccount } from "../../state/AccountContext";
import PersonForm, { emptyPerson } from "./PersonForm";
export default function ParticipantDirectory() {
  const { participants, saveParticipant, removeParticipant } = useAccount();
  const [editing, setEditing] = useState<number | null | undefined>(undefined),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const current = participants.find((p) => p.id === editing);
  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      await removeParticipant(id);
      setRemoving(null);
      if (editing === id) setEditing(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível remover.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Meus participantes</h2>
      <p>
        {participants.length} de 20 participantes. O cadastro de participante
        não cria uma conta de acesso.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {participants.length === 0 && <p>Nenhum participante cadastrado.</p>}
      <ul className="account-participants">
        {participants.map((p) => (
          <li key={p.id}>
            <div>
              <strong>{p.person.name}</strong>
              <span className="field-help">
                CPF final {p.person.cpf.slice(-4)}
              </span>
            </div>
            <div className="account-actions">
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  setEditing(p.id);
                  setRemoving(null);
                }}
              >
                Editar {p.person.name}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setRemoving(p.id)}
              >
                Remover {p.person.name}
              </button>
            </div>
            {removing === p.id && (
              <div role="group" aria-label="Confirmar remoção">
                <p>Remover este participante do seu cadastro?</p>
                <button
                  disabled={busy}
                  type="button"
                  className="button secondary small"
                  onClick={() => remove(p.id)}
                >
                  Confirmar remoção
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setRemoving(null)}
                >
                  Cancelar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {editing === undefined ? (
        <button
          type="button"
          className="button secondary"
          disabled={participants.length >= 20}
          onClick={() => setEditing(null)}
        >
          Adicionar participante
        </button>
      ) : (
        <>
          <h3>{current ? "Editar participante" : "Novo participante"}</h3>
          <PersonForm
            key={current?.id ?? "new"}
            initial={current?.person ?? emptyPerson()}
            label="Salvar participante"
            onSave={async (person) => {
              await saveParticipant(person, current?.id, current?.version);
              setEditing(undefined);
            }}
          />
          <button
            type="button"
            className="text-button"
            onClick={() => setEditing(undefined)}
          >
            Cancelar edição
          </button>
        </>
      )}
    </section>
  );
}
