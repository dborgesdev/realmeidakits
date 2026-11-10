import { useAccount } from "../state/AccountContext";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useCatalog } from "../state/CatalogContext";
import { useRequest } from "../state/RequestContext";
import { pendingStage, stages, stageLabels } from "../state/requestRules";
import RequestRacePicker from "../components/flow/RequestRacePicker";
import DraftStatus from "../components/flow/DraftStatus";
import Progress from "../components/flow/Progress";
import QuantityStep from "../components/flow/QuantityStep";
import ResponsibleStep from "../components/flow/ResponsibleStep";
import ParticipantsStep from "../components/flow/ParticipantsStep";
import DocumentsStep from "../components/flow/DocumentsStep";
import ConditionsStep from "../components/flow/ConditionsStep";
import ReviewStep from "../components/flow/ReviewStep";
import PaymentStep from "../components/flow/PaymentStep";
import {
  controlId,
  firstIssue,
  type FlowIssue,
} from "../state/validationRules";
import {
  FlowFeedback,
  focusControl,
  type PanelNavigation,
} from "../components/flow/FlowFeedback";
import NotFound from "./NotFound";
export default function RequestPage() {
  const account = useAccount();
  const { events } = useCatalog();
  const { stage = "pedido" } = useParams();
  const navigate = useNavigate();
  const { draft, resize, persistence } = useRequest();
  const [issue, setIssue] = useState<FlowIssue | null>(null);
  const [navigation, setNavigation] = useState<PanelNavigation | null>(null);
  const [checkingAssignments, setCheckingAssignments] = useState(false);
  function navigatePanel(id: string) {
    setIssue(null);
    setNavigation((n) => ({
      participantId: id,
      sequence: (n?.sequence || 0) + 1,
    }));
  }
  function clearFeedback() {
    setIssue(null);
    setNavigation(null);
  }
  if (account.status === "loading")
    return (
      <div className="container page">
        <p role="status">Conectando sua conta…</p>
      </div>
    );
  if (account.status === "error")
    return (
      <div className="container page">
        <p role="alert">{account.error}</p>
        <button className="button" onClick={() => void account.recheck()}>
          Verificar sessão novamente
        </button>
        <Link to="/conta">Minha conta</Link>
      </div>
    );
  if (!account.profile)
    return (
      <Navigate
        replace
        to={"/conta?continuar=" + encodeURIComponent("/solicitacao/" + stage)}
      />
    );
  if (
    persistence.status === "loading" ||
    (persistence.status === "error" && !persistence.loaded)
  )
    return (
      <div className="container page">
        <DraftStatus />
      </div>
    );
  if (draft.order) return <Navigate replace to="/conclusao" />;
  const aliases: Record<string, string> = {
    configuracao: "pedido",
    identificacao: "responsavel",
    dados: "participantes",
    confirmacao: "revisao",
  };
  if (aliases[stage])
    return <Navigate replace to={`/solicitacao/${aliases[stage]}`} />;
  const step = stages.indexOf(stage);
  if (step < 0) return <NotFound />;
  if (!draft.selectedRaceIds.length)
    return (
      <div className="container page narrow">
        <h1>Escolha suas corridas</h1>
        <DraftStatus stage="pedido" />
        <p>Selecione ao menos uma corrida para continuar.</p>
        <RequestRacePicker />
        <Link className="button" reloadDocument to="/corridas">
          Selecionar corridas →
        </Link>
      </div>
    );
  const pending = pendingStage(draft, events, account.participantLimit);
  const blocked = stages.indexOf(pending);
  if (step > blocked && blocked < 5)
    return <Navigate replace to={`/solicitacao/${pending}`} />;
  const visibleIssue =
    issue &&
    (issue.target === "flow-error-summary" ||
      issue.target.startsWith("save-person--") ||
      firstIssue(stage, draft, events)?.target === issue.target)
      ? issue
      : null;
  async function next() {
    if (checkingAssignments) return;
    setIssue(null);
    if (step === 0) {
      resize(draft.participants.length);
      navigate("/solicitacao/responsavel");
      return;
    }
    if (blocked <= step && blocked < 5) {
      setNavigation(null);
      setIssue(
        firstIssue(stages[blocked], draft, events) || {
          target: "flow-error-summary",
          message:
            "Confira os dados e as corridas deste pedido antes de continuar.",
        },
      );
      return;
    }
    if (step === 2) {
      const unsaved = draft.participants.find(
        (p) =>
          !account.participants.some(
            (saved) =>
              saved.id === p.directoryId &&
              Object.entries(saved.person).every(
                ([key, value]) =>
                  p.person[key as keyof typeof p.person] === value,
              ),
          ),
      );
      if (unsaved) {
        setIssue({
          target: controlId("save-person", unsaved.id),
          participantId: unsaved.id,
          message: "Salve o cadastro do participante antes de continuar.",
        });
        return;
      }
      if (persistence.status === "saved") {
        setCheckingAssignments(true);
        try {
          const { conflicts } = await account.request<{
            conflicts: { slot: string; raceId: string }[];
          }>("/account/draft/registration-conflicts", "POST", {});
          if (conflicts.length) {
            setIssue({
              target: "flow-error-summary",
              message:
                "Remova apenas a atribuição marcada como já inscrita antes de continuar.",
            });
            return;
          }
        } catch {
          // Checkout repeats the authoritative check if the advisory lookup is unavailable.
        } finally {
          setCheckingAssignments(false);
        }
      }
    }
    if (step === 6) return;
    navigate(`/solicitacao/${stages[step + 1]}`);
  }
  return (
    <div className="flow-shell">
      <div className="container page flow">
        <div className="flow-heading">
          <RequestRacePicker />
          <span className="badge">{draft.participants.length} pessoa(s)</span>
        </div>
        <DraftStatus stage={stage} />
        <Progress step={step} />
        <FlowFeedback
          issue={issue}
          visibleIssue={visibleIssue}
          navigation={navigation}
          navigatePanel={navigatePanel}
          clear={clearFeedback}
        >
          <div className="flow-panel">
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void next();
              }}
            >
              <span className="eyebrow">{stageLabels[step]}</span>
              {step === 0 && <QuantityStep />}
              {step === 1 && <ResponsibleStep />}
              {step === 2 && <ParticipantsStep />}
              {step === 3 && <DocumentsStep />}
              {step === 4 && <ConditionsStep />}
              {step === 5 && <ReviewStep />}
              {step === 6 && <PaymentStep />}
              {visibleIssue && (
                <div
                  className="error-summary"
                  id="flow-error-summary"
                  role="alert"
                  tabIndex={-1}
                >
                  <p>Não foi possível continuar: {visibleIssue.message}</p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => focusControl(visibleIssue.target)}
                  >
                    Ir para a pendência →
                  </button>
                </div>
              )}
              <div className="flow-actions">
                <Link
                  className="button secondary"
                  reloadDocument={step === 0}
                  to={
                    step === 0
                      ? "/corridas"
                      : `/solicitacao/${stages[step - 1]}`
                  }
                >
                  ← Voltar
                </Link>
                {step < 6 && (
                  <button className="button" type="submit">
                    {step === 5 ? "Revisar e finalizar →" : "Continuar →"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </FlowFeedback>
      </div>
    </div>
  );
}
