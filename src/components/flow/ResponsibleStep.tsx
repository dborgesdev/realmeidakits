import { FieldError, useFlowFeedback } from "./FlowFeedback";
import { useDemo } from "../../state/DemoContext";
export default function ResponsibleStep() {
  const { draft, setDraft } = useDemo();
  const { field } = useFlowFeedback();
  return (
    <>
      <h1>Quem será responsável pelo pedido?</h1>
      <p>
        A pessoa responsável reúne os pedidos e, na versão real, será titular da
        conta e do pagamento. Também poderá participar.
      </p>
      <fieldset className="form-section">
        <legend>Contato da pessoa responsável</legend>
        <label>
          Nome da pessoa responsável (demonstração)
          <input
            {...field("responsible-name")}
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
        <FieldError id="responsible-name" />
        <div className="form-grid">
          <label>
            E-mail da pessoa responsável
            <input readOnly value={draft.responsible.email} />
          </label>
          <label>
            Telefone / WhatsApp da pessoa responsável
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
