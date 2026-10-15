import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Shirt, UsersRound } from "lucide-react";
import { events } from "../data/events";
import { useDemo } from "../state/DemoContext";
import { Action, DemoNotice } from "../components/UI";
import Voucher from "../components/flow/Voucher";
import Progress from "../components/flow/Progress";
import IdentityStep from "../components/flow/IdentityStep";
import DataStep from "../components/flow/DataStep";
import DocumentsStep from "../components/flow/DocumentsStep";
import ReviewStep from "../components/flow/ReviewStep";
import PaymentStep from "../components/flow/PaymentStep";
import NotFound from "./NotFound";
import { stages, documentsReady, dataReady } from "../state/requestRules";
export default function RequestPage() {
  const { slug, stage = "modalidade" } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { draft, setDraft, reset } = useDemo();
  const [error, setError] = useState("");
  const event = events.find((e) => e.slug === slug);
  const step = stages.indexOf(stage);
  if (!event || step < 0) return <NotFound />;
  if (step > 0 && draft.slug !== slug)
    return <Navigate replace to={`/solicitacao/${slug}/modalidade`} />;
  if (step > 1 && !draft.identified)
    return <Navigate replace to={`/solicitacao/${slug}/identificacao`} />;
  if (step > 2 && !dataReady(draft, event))
    return <Navigate replace to={`/solicitacao/${slug}/dados`} />;
  const docsReady = documentsReady(
    draft.documents,
    event.authorization,
    draft.authorized,
  );
  if (step >= 4 && !docsReady)
    return <Navigate replace to={`/solicitacao/${slug}/documentos`} />;
  if (step === 6 && !draft.confirmed)
    return <Navigate replace to={`/solicitacao/${slug}/revisao`} />;
  function next() {
    setError("");
    if (step === 1) setDraft({ ...draft, identified: true });
    if (step === 2 && !dataReady(draft, event!)) {
      setError(
        "Confira os campos obrigatórios e use apenas os identificadores de demonstração.",
      );
      return;
    }
    if (step === 3 && !docsReady) {
      setError(
        "Selecione todos os documentos obrigatórios e confira a autorização.",
      );
      return;
    }
    if (step === 5) setDraft({ ...draft, confirmed: true });
    navigate(`/solicitacao/${slug}/${stages[step + 1]}`);
  }
  function choose(modality: "oficial" | "appai") {
    if (draft.slug !== slug) reset(slug!, modality);
    else setDraft({ ...draft, modality, confirmed: false });
    navigate(`/solicitacao/${slug}/identificacao`);
  }
  return (
    <div className="flow-shell">
      <div className="container page flow">
        <DemoNotice />
        <div className="flow-heading">
          <Link to={`/corridas/${slug}`} className="text-link">
            ← {event.name}
          </Link>
          <span className="badge">EVENTO ILUSTRATIVO</span>
        </div>
        <Progress step={step} />
        <div className="flow-panel">
          {step === 0 ? (
            <>
              <span className="eyebrow">VAMOS COMEÇAR</span>
              <h1>Qual é a sua modalidade?</h1>
              <p>Escolha o caminho que corresponde ao seu perfil.</p>
              <div className="grid two choices">
                {[
                  {
                    id: "oficial" as const,
                    title: "Kit oficial",
                    Icon: Shirt,
                    text: "Já tenho inscrição na corrida.",
                  },
                  {
                    id: "appai" as const,
                    title: "Associado à APPAI",
                    Icon: UsersRound,
                    text: "Vou informar minha matrícula APPAI.",
                  },
                ]
                  .sort((a, b) =>
                    search.get("modalidade") === a.id
                      ? -1
                      : search.get("modalidade") === b.id
                        ? 1
                        : 0,
                  )
                  .map(({ id, title, Icon, text }) => (
                    <button
                      key={id}
                      className="choice"
                      onClick={() => choose(id)}
                    >
                      <Icon size={36} />
                      <h2>{title}</h2>
                      <p>{text}</p>
                      <span>Continuar →</span>
                    </button>
                  ))}
              </div>
            </>
          ) : step === 6 ? (
            <>
              <span className="eyebrow">EXPERIÊNCIA CONCLUÍDA</span>
              <h1>Sua solicitação de exemplo está pronta.</h1>
              <p>
                Nenhum pedido real foi criado. Nenhum pagamento foi confirmado,
                documento enviado ou e-mail disparado.
              </p>
              <Voucher event={event} draft={draft} />
              <div className="actions">
                <Action to="/orientacoes">
                  Conferir orientações de retirada
                </Action>
                <Action secondary to="/corridas">
                  Explorar outras corridas
                </Action>
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <span className="eyebrow">{event.name} · DEMONSTRAÇÃO</span>
              {step === 1 && <IdentityStep />}
              {step === 2 && <DataStep event={event} />}
              {step === 3 && (
                <DocumentsStep authorization={event.authorization} />
              )}
              {step === 4 && <ReviewStep event={event} />}
              {step === 5 && <PaymentStep />}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="flow-actions">
                <Link
                  className="button secondary"
                  to={`/solicitacao/${slug}/${stages[step - 1]}`}
                >
                  ← Voltar
                </Link>
                <button className="button" type="submit">
                  {step === 5
                    ? "Concluir demonstração"
                    : step === 4
                      ? "Ver pagamento simulado"
                      : step === 1
                        ? "Usar perfil de demonstração"
                        : "Continuar"}{" "}
                  →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
