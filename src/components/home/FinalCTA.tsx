import { Action } from "../UI";
export default function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div>
          <span className="eyebrow">ESCOLHA SUA CORRIDA</span>
          <h2>Solicite a retirada do seu kit</h2>
          <p>Encontre sua corrida e confira as opções de retirada.</p>
        </div>
        <Action to="/corridas">Solicitar kit</Action>
      </div>
    </section>
  );
}
