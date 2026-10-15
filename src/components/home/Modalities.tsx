import { Shirt, UsersRound } from "lucide-react";
import { asset } from "../../data/events";
import { Action } from "../UI";
export default function Modalities() {
  return (
    <section className="container section" id="modalidades">
      <span className="eyebrow">DO SEU JEITO</span>
      <h2>Escolha sua modalidade</h2>
      <p>Dois caminhos, a mesma praticidade para solicitar a retirada.</p>
      <div className="grid two modality-grid">
        {[
          {
            name: "Kit oficial",
            text: "Para quem já tem inscrição na corrida. Confira os documentos exigidos pelo evento.",
            image: "modality-kit-oficial.webp",
            Icon: Shirt,
            query: "oficial",
          },
          {
            name: "Associado à APPAI",
            text: "Informe sua matrícula e escolha camiseta com tamanho ou somente número de peito.",
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
              alt={`Imagem conceitual da modalidade ${name}`}
            />
            <div>
              <Icon className="red" size={32} />
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
