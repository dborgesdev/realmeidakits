import { Link, Navigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useDemo } from "../state/DemoContext";
import { DemoNotice } from "../components/UI";
import Voucher from "../components/flow/Voucher";
import OrderSummary from "../components/flow/OrderSummary";
export default function ConclusionPage() {
  const { draft, restart } = useDemo();
  const order = draft.order;
  if (!order) return <Navigate replace to="/corridas" />;
  return (
    <div className="flow-shell">
      <div className="container page narrow">
        <DemoNotice />
        <header className="conclusion-heading">
          <CheckCircle2 size={48} aria-hidden="true" />
          <span className="eyebrow">JORNADA DEMONSTRATIVA CONCLUÍDA</span>
          <h1>Pedido finalizado!</h1>
          <p>{order.id} · Identificador fictício</p>
          <p>
            {order.participants.length} participante(s) ·{" "}
            {order.participants.reduce((n, p) => n + p.items.length, 0)}{" "}
            retirada(s) demonstrativa(s)
          </p>
          <p>Pessoa responsável: {order.responsible.name}</p>
          <p>
            Esta é uma demonstração. Nenhuma cobrança ou pedido real foi
            realizado. O pedido demonstrativo está encerrado e bloqueado para
            edição.
          </p>
          <div className="actions">
            <Link className="button" to="/acompanhamento">
              Acompanhar pedido
            </Link>
            <a className="button secondary" href="#vouchers">
              Ver vouchers e grupos
            </a>
            <Link className="button secondary" to="/corridas" onClick={restart}>
              Nova inscrição
            </Link>
          </div>
        </header>
        <section id="vouchers">
          <h2>Vouchers por participante e corrida</h2>
          {order.participants.map((p) => (
            <section className="participant-vouchers" key={p.id}>
              <h2>{p.person.name}</h2>
              <OrderSummary items={p.items} method={order.method} />
              {p.items.map((item) => (
                <Voucher
                  key={item.raceId}
                  participant={p}
                  item={item}
                  order={order}
                />
              ))}
            </section>
          ))}
        </section>
      </div>
    </div>
  );
}
