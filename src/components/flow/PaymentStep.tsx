import { useDemo } from "../../state/DemoContext";
export default function PaymentStep() {
  const { draft, setDraft } = useDemo();
  return (
    <>
      <h1>Conheça as opções de pagamento</h1>
      <p>
        Simulação sem cobrança. Valores serão definidos por evento e modalidade
        na versão funcional.
      </p>
      <fieldset>
        <legend>Escolha uma opção para visualizar</legend>
        {["Pix", "Cartão"].map((method) => (
          <label className="radio payment-option" key={method}>
            <input
              type="radio"
              name="method"
              checked={draft.method === method}
              onChange={() => setDraft({ ...draft, method, confirmed: false })}
            />
            <strong>{method}</strong>
          </label>
        ))}
      </fieldset>
      <div className="soft inset">
        <h3>
          {draft.method === "Pix"
            ? "Pix demonstrativo"
            : "Cartão demonstrativo"}
        </h3>
        <p>
          {draft.method === "Pix"
            ? "Na versão funcional, o checkout exibirá o código Pix do provedor de pagamento. Não há chave ou código copiável aqui."
            : "O preenchimento dos dados do cartão acontecerá no checkout seguro da versão funcional. Não informe números reais nesta prévia."}
        </p>
        <strong>Nenhuma transação será realizada ou confirmada.</strong>
      </div>
    </>
  );
}
