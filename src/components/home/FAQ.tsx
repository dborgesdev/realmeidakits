export default function FAQ() {
  return (
    <section className="container section faq">
      <div>
        <span className="eyebrow">PODE PERGUNTAR</span>
        <h2>Antes de começar</h2>
        <p>Respostas para seguir com tranquilidade.</p>
      </div>
      <div>
        {[
          [
            "Estou comprando uma inscrição?",
            "Não. O serviço apresentado é a retirada do kit para participantes. Esta V1 é uma demonstração.",
          ],
          [
            "Quais documentos preciso apresentar?",
            "Depende das exigências da corrida e da modalidade. Confira os documentos na página do evento.",
          ],
          [
            "O que significa autorizar a retirada?",
            "A solicitação é individual. A autorização permite que a Re Almeida retire fisicamente o kit pela participante.",
          ],
          [
            "Vou pagar ou enviar documentos de verdade?",
            "Não. Nenhuma cobrança ou transmissão de arquivos acontece nesta prévia. Use apenas dados fictícios.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
