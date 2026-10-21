import { useDemo } from "../../state/DemoContext";
export default function ResponsibleStep() {
  const { draft, setDraft } = useDemo();
  return (
    <>
      <h1>Quem será responsável pelo pedido?</h1>
      <p>
        O responsável reúne as solicitações e, na versão real, será titular da
        conta e do pagamento. Também poderá participar.
      </p>
      <fieldset className="form-section">
        <legend>Contato do responsável</legend>
        <label>
          Nome do responsável (demonstração)
          <input
            required
            minLength={3}
            maxLength={80}
            autoComplete="off"
            value={draft.responsible.name}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                responsible: { ...d.responsible, name: e.target.value },
              }))
            }
          />
        </label>
        <div className="form-grid">
          <label>
            E-mail do responsável
            <input readOnly value={draft.responsible.email} />
          </label>
          <label>
            Telefone / WhatsApp do responsável
            <input readOnly value={draft.responsible.phone} />
          </label>
        </div>
        <label>
          Identificação demonstrativa
          <input readOnly value={draft.responsible.identifier} />
        </label>
        <p className="field-help">
          Marcadores fictícios. Sem login, pesquisa de CPF ou envio de
          mensagens.
        </p>
      </fieldset>
    </>
  );
}
