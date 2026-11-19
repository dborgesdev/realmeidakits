import { useAccount } from "../state/AccountContext";
import { useState, useRef } from "react";
import { persistParticipants } from "../state/persistParticipants";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useCatalog } from "../state/CatalogContext";
import { useRequest } from "../state/RequestContext";
import { pendingStage, stages, stageLabels } from "../state/requestRules";
import RequestRacePicker from "../components/flow/RequestRacePicker";
import RequestIntro from "../components/flow/RequestIntro";
import DraftStatus from "../components/flow/DraftStatus";
import Progress from "../components/flow/Progress";
import QuantityStep from "../components/flow/QuantityStep";
import ResponsibleStep from "../components/flow/ResponsibleStep";
import ParticipantsStep from "../components/flow/ParticipantsStep";
import DocumentsStep from "../components/flow/DocumentsStep";
import ConditionsStep from "../components/flow/ConditionsStep";
import ReviewStep from "../components/flow/ReviewStep";
import PaymentStep from "../components/flow/PaymentStep";
import { firstIssue, type FlowIssue } from "../state/validationRules";
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
  const { draft, resize, persistence, setDraft } = useRequest();
  const [issue, setIssue] = useState<FlowIssue | null>(null);
  const [navigation, setNavigation] = useState<PanelNavigation | null>(null);
  const [checkingAssignments, setCheckingAssignments] = useState(false);
  const advancing = useRef(false);
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
    if (checkingAssignments || advancing.current) return;
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
      advancing.current = true;
      setCheckingAssignments(true);
      try {
        await persistParticipants(
          draft.participants,
          account.participants,
          account.saveParticipant,
          (slot, saved) => {
            setDraft((current) => ({
              ...current,
              participants: current.participants.map((person) =>
                person.id === slot
                  ? {
                      ...person,
                      person: saved.person,
                      directoryId: saved.id,
                      directoryVersion: saved.version,
                    }
                  : person,
              ),
            }));
          },
        );
      } catch (cause) {
        try {
          await account.refresh();
        } catch {
          /* Keep the entered values when the session/network is unavailable. */
        }
        setIssue({
          target: "flow-error-summary",
          message:
            cause instanceof Error
              ? cause.message
              : "Não foi possível salvar os participantes. Seus dados foram preservados.",
        });
        setCheckingAssignments(false);
        advancing.current = false;
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
                "Já existe um pedido para um dos participantes nesta corrida. Remova essa corrida apenas do participante indicado antes de continuar.",
            });
            return;
          }
        } catch {
          // Checkout repeats the authoritative check if the advisory lookup is unavailable.
        } finally {
          setCheckingAssignments(false);
          advancing.current = false;
        }
      }
      setCheckingAssignments(false);
      advancing.current = false;
    }
    if (step === 6) return;
    navigate(`/solicitacao/${stages[step + 1]}`);
  }
  return (
    <div className="flow-shell">
      <div className="container page flow">
        <RequestIntro
          races={events.filter((race) =>
            draft.selectedRaceIds.includes(race.id),
          )}
          participants={draft.participants.length}
        />
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
              <fieldset
                disabled={checkingAssignments}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                {step === 0 && <QuantityStep />}
                {step === 1 && <ResponsibleStep />}
                {step === 2 && <ParticipantsStep />}
                {step === 3 && <DocumentsStep />}
                {step === 4 && <ConditionsStep />}
                {step === 5 && <ReviewStep />}
                {step === 6 && <PaymentStep />}
              </fieldset>
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
                  <button
                    className="button"
                    type="submit"
                    disabled={checkingAssignments}
                  >
                    {checkingAssignments
                      ? "Salvando participantes…"
                      : step === 5
                        ? "Revisar e finalizar →"
                        : "Continuar →"}
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
