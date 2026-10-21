import { Link } from "react-router-dom";
import type { DemoOrder } from "../../types/domain";
import OrderSummary from "./OrderSummary";
export default function ConfirmationStep({ order }: { order: DemoOrder }) {
  return (
    <>
      <span className="eyebrow">EXPERIÊNCIA CONCLUÍDA</span>
      <h1>Sua solicitação de exemplo está organizada.</h1>
      <p>
        <strong>{order.id}</strong> · Uma participante, {order.items.length}{" "}
        {order.items.length === 1 ? "corrida" : "corridas"}, um pagamento apenas
        simulado. Nenhum pedido real, documento enviado ou cobrança confirmada.
      </p>
      <OrderSummary items={order.items} method={order.method} />
      <div className="actions">
        <Link className="button" to="/acompanhamento">
          Acompanhar solicitação demonstrativa →
        </Link>
        <Link className="button secondary" to="/solicitacao/configuracao">
          Revisar esta demonstração
        </Link>
      </div>
      <p className="field-help">
        A próxima tela exemplifica números de peito, retirada e vouchers por
        corrida. Sem login ou conta; ao recarregar, a demonstração é reiniciada.
      </p>
    </>
  );
}
