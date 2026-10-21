import { useState } from "react";
import { Link } from "react-router-dom";
import { DemoNotice, PageTitle } from "../components/UI";
import { useDemo } from "../state/DemoContext";
import type { TrackingScenario } from "../state/trackingRules";
import TrackingList from "../components/tracking/TrackingList";
import OrderSummary from "../components/flow/OrderSummary";
export default function TrackingPage() {
  const { draft, restart } = useDemo();
  const [scenario, setScenario] = useState<TrackingScenario>("waiting");
  const order = draft.order;
  return (
    <div className="flow-shell">
      <div className="container page narrow">
        <DemoNotice />
        <PageTitle
          eyebrow="SEM LOGIN · SEM OPERAÇÃO REAL"
          title="Acompanhamento demonstrativo"
        >
          Uma prévia de como consultar suas corridas. Esta tela não define a
          futura interface de Minha Conta do WooCommerce.
        </PageTitle>
        {!order ? (
          <div className="panel empty-state">
            <h2>Ainda não há solicitação nesta sessão</h2>
            <p>
              Conclua a jornada demonstrativa para conhecer os status por
              corrida. Recarregar a página apaga os exemplos preenchidos.
            </p>
            <Link className="button" to="/corridas">
              Selecionar corridas →
            </Link>
          </div>
        ) : (
          <>
            <div className="panel">
              <span className="eyebrow">
                {order.id} · IDENTIFICADOR FICTÍCIO
              </span>
              <h2>{order.responsible.name}</h2>
              <p>
                CPF DEMO-CPF ·{" "}
                {order.participants.reduce((n, p) => n + p.items.length, 0)}{" "}
                corrida(s). Nenhum pagamento bancário confirmado.
              </p>
              {order.participants.map((p) => (
                <section key={p.id}>
                  <h3>{p.person.name}</h3>
                  <OrderSummary items={p.items} method={order.method} />
                </section>
              ))}
              <label>
                Cenário de acompanhamento
                <select
                  value={scenario}
                  onChange={(e) =>
                    setScenario(e.target.value as TrackingScenario)
                  }
                >
                  <option value="waiting">Exemplo: aguardando retirada</option>
                  <option value="withdrawn">
                    Exemplo: primeira corrida já retirada
                  </option>
                </select>
                <span className="field-help">
                  Alterna somente a visualização fictícia. A operação real e a
                  atribuição dos números ocorrerão no WordPress.
                </span>
              </label>
            </div>
            <TrackingList order={order} scenario={scenario} />
            <div className="notice">
              Notificações por WhatsApp dependerão da avaliação de custos e
              habilitação da plataforma oficial. O acompanhamento pelo site será
              independente delas.
            </div>
            <div className="actions">
              <Link className="button secondary" to="/conclusao">
                Ver conclusão e vouchers
              </Link>
              <Link className="text-link" to="/corridas" onClick={restart}>
                Nova solicitação
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
