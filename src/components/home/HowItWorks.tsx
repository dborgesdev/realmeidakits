import {
  CalendarCheck,
  ChevronRight,
  Files,
  UsersRound,
  Ticket,
} from "lucide-react";
const steps = [
  {
    Icon: CalendarCheck,
    title: "Escolha a corrida",
    text: "Veja as corridas disponíveis e selecione as que você procura.",
  },
  {
    Icon: UsersRound,
    title: "Cadastre os participantes",
    text: "Informe os dados de cada pessoa e escolha as opções de retirada.",
  },
  {
    Icon: Files,
    title: "Envie os documentos",
    text: "Anexe o que a corrida exige e confira os dados antes de finalizar.",
  },
  {
    Icon: Ticket,
    title: "Acompanhe o pedido",
    text: "Consulte a situação do pedido e as informações de retirada.",
  },
];
export default function HowItWorks() {
  return (
    <section className="soft section" id="como-funciona">
      <div className="container">
        <span className="eyebrow">DO INÍCIO À RETIRADA</span>
        <h2>Como funciona</h2>
        <p>Da escolha da corrida ao acompanhamento do pedido.</p>
        <ol className="grid four steps">
          {steps.map(({ Icon, title, text }, i) => (
            <li className="panel" key={title}>
              <div className="step-top">
                <Icon size={32} aria-hidden="true" />
              </div>
              <span className="step-number" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{title}</h3>
              {i < steps.length - 1 && (
                <ChevronRight
                  className="step-connector"
                  size={20}
                  aria-hidden="true"
                />
              )}
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
