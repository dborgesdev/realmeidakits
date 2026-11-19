import { CalendarCheck, FileCheck2, PackageCheck } from "lucide-react";
import { Action } from "../UI";
import { asset } from "../../data/assets";
export default function Hero() {
  return (
    <section className="hero">
      <img
        src={asset("hero-running-kit-pickup.webp")}
        alt=""
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <div className="container hero-content">
        <span className="eyebrow">VOCÊ CORRE. A GENTE FACILITA.</span>
        <h1>
          <span>Retirada de</span> <span>kits de corrida</span>{" "}
          <em>com mais praticidade.</em>
        </h1>
        <p>
          A Re Almeida retira o kit por você. Escolha sua corrida e consulte as
          opções para quem já tem inscrição oficial ou é associado à APPAI.
        </p>
        <div className="actions">
          <Action to="/corridas">Solicitar meu kit</Action>
          <Action to="/corridas?modalidade=appai" secondary>
            Sou associado à APPAI
          </Action>
        </div>
        <div className="hero-benefits">
          <span>
            <CalendarCheck aria-hidden="true" />
            Solicitação online
          </span>
          <span>
            <FileCheck2 aria-hidden="true" />
            Documentos por participante
          </span>
          <span>
            <PackageCheck aria-hidden="true" />
            Retirada por corrida
          </span>
        </div>
      </div>
      <svg
        className="hero-wave"
        viewBox="0 0 1440 88"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#e10600"
          opacity=".18"
          d="M0 56C220 15 409 121 686 70S1156 90 1440 0V88H0Z"
        />
        <path
          fill="#c90803"
          d="M0 63C223 30 428 122 700 75S1197 69 1440 17V88H0Z"
        />
        <path
          fill="#fbf5f5"
          d="M0 74C221 39 427 122 701 79S1197 82 1440 34V88H0Z"
        />
      </svg>
    </section>
  );
}
