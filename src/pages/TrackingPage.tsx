import { PageTitle, Action } from "../components/UI";
export default function TrackingPage() {
  return (
    <div className="container page narrow">
      <PageTitle eyebrow="PEDIDOS" title="Acompanhar pedido" />
      <div className="panel">
        <p>Acompanhamento de pedidos ainda indisponível.</p>
        <Action to="/corridas">Ver corridas</Action>
      </div>
    </div>
  );
}
