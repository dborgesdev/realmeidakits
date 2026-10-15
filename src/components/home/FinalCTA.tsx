import { Action } from "../UI";
export default function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div>
          <span className="eyebrow">MENOS ETAPAS FORA DA PISTA</span>
          <h2>Pronta para o próximo passo?</h2>
          <p>Conheça a experiência de solicitar sua retirada.</p>
        </div>
        <Action to="/corridas">Começar agora</Action>
      </div>
    </section>
  );
}
