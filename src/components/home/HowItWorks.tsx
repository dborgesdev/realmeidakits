import { CalendarCheck, Files, CreditCard, Ticket } from "lucide-react";
const steps = [
  {
    Icon: CalendarCheck,
    title: "Escolha suas corridas",
    text: "Selecione uma ou várias provas e configure cada modalidade.",
  },
  {
    Icon: Files,
    title: "Organize os documentos",
    text: "Preencha seus dados e confira o que a corrida exige.",
  },
  {
    Icon: CreditCard,
    title: "Revise seu pedido",
    text: "Confira as informações e conheça o pagamento simulado.",
  },
  {
    Icon: Ticket,
    title: "Acompanhe cada corrida",
    text: "Veja números de peito, retirada e vouchers ilustrativos por prova.",
  },
];
export default function HowItWorks() {
  return (
    <section className="soft section" id="como-funciona">
      <div className="container">
        <span className="eyebrow">DO INÍCIO À RETIRADA</span>
        <h2>Como funciona</h2>
        <p>Uma etapa de cada vez. Tudo em um só lugar.</p>
        <div className="grid four steps">
          {steps.map(({ Icon, title, text }, i) => (
            <article className="panel" key={title}>
              <div className="step-top">
                <span className="step-number">0{i + 1}</span>
                <Icon size={30} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
