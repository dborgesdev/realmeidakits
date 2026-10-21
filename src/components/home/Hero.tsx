import { ClipboardCheck, FileCheck2, UsersRound } from "lucide-react";
import { Action } from "../UI";
import { asset } from "../../data/events";
export default function Hero() {
  return (
    <section className="hero">
      <img
        src={asset("hero-running-kit-pickup.webp")}
        alt="Imagem conceitual de corredoras à beira-mar"
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <div className="container hero-content">
        <span className="eyebrow">VOCÊ CORRE. A GENTE FACILITA.</span>
        <h1>
          Retirada de kits de corrida <em>com mais praticidade.</em>
        </h1>
        <p>
          Solicite a retirada como associado à APPAI ou de um kit já comprado
          com a organização. Aqui você não compra inscrições oficiais nas
          corridas.
        </p>
        <div className="actions">
          <Action to="/corridas?modalidade=appai">Sou associado à APPAI</Action>
          <Action to="/corridas?modalidade=oficial" secondary>
            Já comprei meu kit com a organização
          </Action>
        </div>
        <div className="hero-benefits">
          <span>
            <ClipboardCheck />
            Inscrição
            <br />
            passo a passo
          </span>
          <span>
            <FileCheck2 />
            Documentos
            <br />
            organizados
          </span>
          <span>
            <UsersRound />
            Retirada
            <br />
            por evento
          </span>
        </div>
        <small>Prévia demonstrativa · Fotografia conceitual</small>
      </div>
    </section>
  );
}
