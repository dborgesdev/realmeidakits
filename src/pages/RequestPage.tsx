import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { events } from "../data/events";
import { useDemo } from "../state/DemoContext";
import { DemoNotice } from "../components/UI";
import { pendingStage, stages, stageLabels } from "../state/requestRules";
import { isAvailable } from "../state/selectionRules";
import Progress from "../components/flow/Progress";
import OptionsStep from "../components/flow/OptionsStep";
import IdentityStep from "../components/flow/IdentityStep";
import DataStep from "../components/flow/DataStep";
import DocumentsStep from "../components/flow/DocumentsStep";
import ConditionsStep from "../components/flow/ConditionsStep";
import ReviewStep from "../components/flow/ReviewStep";
import PaymentStep from "../components/flow/PaymentStep";
import ConfirmationStep from "../components/flow/ConfirmationStep";
import NotFound from "./NotFound";
export default function RequestPage() {
  const { stage = "configuracao" } = useParams();
  const navigate = useNavigate();
  const { draft, setDraft } = useDemo();
  const [error, setError] = useState("");
  const step = stages.indexOf(stage);
  if (step < 0) return <NotFound />;
  if (!draft.items.length)
    return (
      <div className="flow-shell">
        <div className="container page narrow">
          <DemoNotice />
          <div className="panel empty-state">
            <h1>Escolha a sua primeira corrida</h1>
            <p>
              Selecione uma ou várias provas para a mesma participante. Se você
              atualizou a página, os dados de demonstração foram apagados.
            </p>
            <Link to="/corridas" className="button">
              Selecionar corridas →
            </Link>
          </div>
        </div>
      </div>
    );
  const blocked = stages.indexOf(pendingStage(draft, events));
  if (step > blocked && step !== 1 && blocked < 5)
    return <Navigate replace to={`/solicitacao/${stages[blocked]}`} />;
  if (step === 1 && blocked === 0)
    return <Navigate replace to="/solicitacao/configuracao" />;
  if (step === 7 && !draft.order)
    return <Navigate replace to="/solicitacao/revisao" />;
  const expired = draft.items.some((item) => {
    const race = events.find((r) => r.id === item.raceId);
    return !race || !isAvailable(race);
  });
  function next() {
    setError("");
    const pending = pendingStage(draft, events);
    const pendingIndex = stages.indexOf(pending);
    if (step === 0 && pendingIndex === 0) {
      setError(
        "Confira as opções de todas as corridas e remova provas encerradas.",
      );
      return;
    }
    if (step === 1)
      setDraft((d) => ({ ...d, identified: true, order: undefined }));
    if (step > 1 && pendingIndex <= step && pendingIndex < 5) {
      setError(
        step === 3
          ? "Confira os dados específicos e todos os documentos exigidos por corrida."
          : "Confira os campos e aceites obrigatórios antes de continuar.",
      );
      return;
    }
    if (step === 6) {
      if (pending !== "revisao") {
        navigate(`/solicitacao/${pending}`);
        return;
      }
      setDraft((d) => ({
        ...d,
        order: {
          id: "DEMO-PEDIDO-001",
          person: { ...d.person },
          items: structuredClone(d.items),
          sharedDocuments: { ...d.sharedDocuments },
          method: d.method,
        },
      }));
    }
    navigate(`/solicitacao/${stages[step + 1]}`);
  }
  return (
    <div className="flow-shell">
      <div className="container page flow">
        <DemoNotice />
        <div className="flow-heading">
          <Link className="text-link" to="/corridas">
            ← Adicionar ou remover corridas
          </Link>
          <span className="badge">
            {draft.items.length} CORRIDA(S) · UMA PARTICIPANTE
          </span>
        </div>
        <Progress step={step} />
        <div className="flow-panel">
          {step === 7 && draft.order ? (
            <ConfirmationStep order={draft.order} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <span className="eyebrow">
                {stageLabels[step]} · DEMONSTRAÇÃO
              </span>
              {step === 0 && <OptionsStep />}
              {step === 1 && <IdentityStep />}
              {step === 2 && <DataStep />}
              {step === 3 && <DocumentsStep />}
              {step === 4 && <ConditionsStep />}
              {step === 5 && <ReviewStep />}
              {step === 6 && <PaymentStep />}
              {expired && (
                <p className="error" role="alert">
                  Uma corrida encerrou as solicitações. Remova-a da seleção para
                  continuar.
                </p>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="flow-actions">
                <Link
                  className="button secondary"
                  to={
                    step === 0
                      ? "/corridas"
                      : `/solicitacao/${stages[step - 1]}`
                  }
                >
                  ← Voltar
                </Link>
                <button className="button" type="submit">
                  {step === 6
                    ? "Concluir demonstração"
                    : step === 5
                      ? "Ver pagamento consolidado"
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
