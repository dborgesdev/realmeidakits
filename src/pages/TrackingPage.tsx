import { PageTitle } from "../components/UI";
import OrderHistory from "../components/account/OrderHistory";
export default function TrackingPage() {
  return (
    <div className="container page narrow">
      <PageTitle eyebrow="PEDIDOS" title="Acompanhar pedido" />
      <div className="panel">
        <OrderHistory />
      </div>
    </div>
  );
}
