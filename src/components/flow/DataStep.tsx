import { useDemo } from "../../state/DemoContext";
export default function DataStep() {
  const { draft, setDraft } = useDemo();
  const person = draft.person;
  return (
    <>
      <h1>Seus dados, uma única vez</h1>
      <p>
        Uma participante individual para todas as {draft.items.length} corridas
        selecionadas. Use somente dados fictícios; nada será salvo fora da
        memória desta página.
      </p>
      <fieldset className="form-section">
        <legend>Dados pessoais demonstrativos</legend>
        <label>
          Nome completo de demonstração
          <input
            required
            minLength={3}
            maxLength={80}
            autoComplete="off"
            value={person.name}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                order: undefined,
                person: { ...d.person, name: e.target.value },
              }))
            }
          />
        </label>
        <div className="form-grid">
          <label>
            CPF demonstrativo
            <input readOnly value={person.cpf} />
          </label>
          <label>
            Nascimento de exemplo
            <input
              required
              type="date"
              min="1900-01-01"
              max={new Date().toISOString().slice(0, 10)}
              value={person.birthDate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  order: undefined,
                  person: { ...d.person, birthDate: e.target.value },
                }))
              }
            />
          </label>
          <label>
            Telefone / WhatsApp demonstrativo
            <input readOnly value={person.phone} />
          </label>
          <label>
            E-mail demonstrativo
            <input readOnly value={person.email} />
          </label>
        </div>
        <p className="field-help">
          CPF, telefone e e-mail usam marcadores fixos para evitar a coleta de
          dados reais. Não existe cadastro ou envio de mensagens. A reutilização
          em futuras solicitações dependerá da conta WordPress/WooCommerce.
        </p>
      </fieldset>
    </>
  );
}
