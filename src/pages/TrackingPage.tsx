import OrderHistory from "../components/account/OrderHistory";
export default function TrackingPage() {
  return (
    <div className="container page narrow">
      <div className="page-title">
        <h1>Meus pedidos</h1>
      </div>
      <OrderHistory />
    </div>
  );
}
