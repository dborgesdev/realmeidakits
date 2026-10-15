import { CalendarCheck, Files, CreditCard, Ticket } from "lucide-react";
const steps = [
  {
    Icon: CalendarCheck,
    title: "Escolha sua corrida",
    text: "Encontre o evento e selecione sua modalidade.",
  },
  {
    Icon: Files,
    title: "Organize os documentos",
    text: "Preencha seus dados e confira o que a corrida exige.",
  },
  {
    Icon: CreditCard,
    title: "Revise sua solicitação",
    text: "Confira as informações e conheça o pagamento simulado.",
  },
  {
    Icon: Ticket,
    title: "Veja o voucher ilustrativo",
    text: "Conclua a experiência e confira um exemplo sem validade para retirada.",
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
