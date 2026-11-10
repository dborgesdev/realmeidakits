import { useRequest } from "../../state/RequestContext";
import { useAccount } from "../../state/AccountContext";
export default function QuantityStep() {
  const { draft, resize } = useRequest();
  const { participantLimit } = useAccount();
  const count = draft.participants.length;
  return (
    <>
      <h1>Para quantas pessoas você vai solicitar a retirada?</h1>
      <p>
        Escolha um pedido individual ou prepare um grupo. Depois você poderá
        acrescentar ou remover participantes sem recomeçar.
      </p>
      <fieldset className="quantity-choices">
        <legend>Quem participa?</legend>
        <label className="radio">
          <input
            type="radio"
            name="quantity-kind"
            checked={count === 1}
            onChange={() => resize(1)}
          />
          <span>
            Somente para mim
            <small>Uma pessoa responsável e um participante</small>
          </span>
        </label>
        <label className="radio">
          <input
            type="radio"
            name="quantity-kind"
            checked={count > 1}
            disabled={participantLimit < 2}
            onChange={() => resize(2)}
          />
          <span>
            Para mais pessoas
            <small>Cada pessoa terá suas próprias corridas e documentos</small>
          </span>
        </label>
      </fieldset>
      {count > 1 && (
        <label>
          Quantidade inicial de participantes
          <select
            value={count}
            onChange={(e) => resize(Number(e.target.value))}
          >
            {Array.from({ length: participantLimit - 1 }, (_, i) => i + 2).map(
              (n) => (
                <option key={n} value={n}>
                  {n} participantes
                </option>
              ),
            )}
          </select>
        </label>
      )}
      <div className="help-panel">
        Até {participantLimit} participantes por pedido do serviço. As corridas
        serão atribuídas a cada pessoa explicitamente, sem incluir todas as
        provas automaticamente. Reduzir a quantidade remove as últimas pessoas e
        suas configurações.
      </div>
    </>
  );
}
