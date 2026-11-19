import { Shirt, UsersRound } from "lucide-react";
import { asset } from "../../data/assets";
import { Action } from "../UI";
export default function Modalities() {
  return (
    <section className="container section" id="modalidades">
      <span className="eyebrow">OPÇÕES POR CORRIDA</span>
      <h2>Modalidades de retirada</h2>
      <p>
        Consulte quais modalidades estão disponíveis para a corrida escolhida.
      </p>
      <div className="grid two modality-grid">
        {[
          {
            name: "Kit Oficial",
            text: "Para quem já tem inscrição oficial e precisa solicitar a retirada do kit.",
            image: "modality-kit-oficial.webp",
            Icon: Shirt,
            query: "oficial",
          },
          {
            name: "Associado à APPAI",
            text: "Informe sua matrícula. Conforme a corrida, escolha camiseta com número ou apenas o número de peito.",
            image: "modality-associado-appai.webp",
            Icon: UsersRound,
            query: "appai",
          },
        ].map(({ name, text, image, Icon, query }) => (
          <article className="modality-card" key={name}>
            <img
              src={asset(image)}
              width="400"
              height="400"
              loading="lazy"
              alt=""
            />
            <div>
              <Icon className="red" size={32} aria-hidden="true" />
              <h3>{name}</h3>
              <p>{text}</p>
              <Action to={`/corridas?modalidade=${query}`}>
                Escolher corrida
              </Action>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
