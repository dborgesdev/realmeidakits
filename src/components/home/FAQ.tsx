import { ChevronDown } from "lucide-react";

export default function FAQ() {
  return (
    <section className="container section faq">
      <div>
        <span className="eyebrow">DÚVIDAS FREQUENTES</span>
        <h2>Perguntas e respostas</h2>
        <p>Confira o que você precisa saber antes de solicitar a retirada.</p>
      </div>
      <div>
        {[
          [
            "Estou comprando uma inscrição?",
            "Não. O serviço apresentado é a retirada do kit para participantes.",
          ],
          [
            "Posso escolher várias corridas?",
            `Sim. Uma pessoa responsável pode organizar vários participantes, cada um com uma ou várias corridas. As opções e os documentos são separados por pessoa e prova.`,
          ],
          [
            "O que significa autorizar a retirada?",
            "Cada pessoa mantém sua identidade e corridas. A autorização específica permite que a Re Almeida retire fisicamente o kit pelo participante.",
          ],
          [
            "Como consultar os documentos exigidos?",
            "Ao preencher a solicitação, consulte os documentos e os modelos exigidos para a corrida e a modalidade escolhidas.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>
              {q}
              <ChevronDown size={20} aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
