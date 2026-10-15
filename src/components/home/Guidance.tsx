import { ShieldCheck, Check } from "lucide-react";
import { Action } from "../UI";
export default function Guidance() {
  return (
    <section className="container guidance">
      <div>
        <span className="eyebrow">INFORMAÇÃO QUE FAZ DIFERENÇA</span>
        <h2>Retirada pela Re Almeida</h2>
        <p>
          A autorização permite que a Re Almeida retire fisicamente o kit por
          você. A solicitação é individual.
        </p>
        <p>
          As exigências variam por corrida. Consulte os documentos antes de
          começar.
        </p>
        <Action secondary to="/orientacoes">
          Conferir orientações
        </Action>
      </div>
      <div className="document-note">
        <ShieldCheck size={45} className="red" />
        <h3>Documentos, sem complicação</h3>
        <p>
          <Check size={18} /> Comprovante de inscrição, quando exigido
        </p>
        <p>
          <Check size={18} /> Identificação com foto, quando exigida
        </p>
        <p>
          <Check size={18} /> Autorização específica, se solicitada
        </p>
        <small>Nesta prévia, use apenas arquivos fictícios.</small>
      </div>
    </section>
  );
}
