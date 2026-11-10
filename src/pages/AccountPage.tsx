import {
  accountUrl,
  continuation,
  clearContinuation,
  rememberedContinuation,
} from "../data/accountClient";
import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import PersonalIdentity from "../components/account/PersonalIdentity";
import OrderHistory from "../components/account/OrderHistory";
import DraftStatus from "../components/flow/DraftStatus";
import { useRequest } from "../state/RequestContext";
import { useAccount } from "../state/AccountContext";
import PersonForm from "../components/account/PersonForm";
import ParticipantDirectory from "../components/account/ParticipantDirectory";
export default function AccountPage() {
  const account = useAccount();
  const { draft, stage, persistence, restart } = useRequest();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const target =
    continuation(params.get("continuar")) ?? rememberedContinuation();
  const next = target && target !== "/conta" ? target : "/corridas";
  async function enter(intent: "login" | "register" | "recover") {
    setBusy(true);
    try {
      await account.login(intent, target ?? "/conta");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir o acesso.",
      );
      setBusy(false);
    }
  }
  const resume =
    account.status === "authenticated" &&
    !params.has("continuar") &&
    target?.startsWith("/solicitacao/") &&
    rememberedContinuation() === target;
  useEffect(() => {
    if (resume) clearContinuation();
  }, [resume]);
  if (account.status === "loading")
    return (
      <div className="container page narrow">
        <h1>Minha conta</h1>
        <p role="status">Conectando sua conta…</p>
      </div>
    );
  if (resume && target) return <Navigate to={target} replace />;
  return (
    <div className="container page account-page">
      <div className="page-title">
        <span className="eyebrow">RE ALMEIDA KITS</span>
        <h1>Minha conta</h1>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {account.error && (
        <p className="error" role="alert">
          {account.error}
        </p>
      )}
      {account.status === "error" && (
        <button
          className="button secondary"
          onClick={() => void account.recheck()}
        >
          Verificar sessão novamente
        </button>
      )}
      {account.profile ? (
        <>
          <section className="panel">
            <div className="account-actions">
              <h2>Dados do titular</h2>
              {account.editUrl && (
                <a href={accountUrl(account.editUrl, "/conta")}>
                  Editar acesso e senha
                </a>
              )}
              <button
                type="button"
                className="button secondary small"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (
                      persistence.dirty &&
                      !window.confirm(
                        "Há alterações ainda não salvas. Sair mesmo assim?",
                      )
                    ) {
                      setBusy(false);
                      return;
                    }
                    await account.logout();
                    setBusy(false);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Não foi possível sair.",
                    );
                    setBusy(false);
                  }
                }}
              >
                Sair da conta
              </button>
            </div>
            <PersonForm
              key={account.profile.id}
              initial={account.profile}
              owner
              label="Salvar meus dados"
              onSave={account.updateProfile}
            />
          </section>
          <PersonalIdentity key={account.profile.id} />
          <ParticipantDirectory />
          <section className="panel">
            <h2>Pedidos recentes</h2>
            <OrderHistory key={account.profile.id} />
            <Link to="/acompanhamento">Acompanhar pedidos</Link>
          </section>
          <section className="panel">
            <h2>Solicitação em andamento</h2>
            <DraftStatus />
            {persistence.loaded && (
              <div className="account-actions">
                {!persistence.submitted && draft.selectedRaceIds.length > 0 && (
                  <Link className="button" to={"/solicitacao/" + stage}>
                    Retomar solicitação
                  </Link>
                )}
                <button
                  type="button"
                  className="button secondary"
                  onClick={async () => {
                    if (
                      persistence.submitted ||
                      !draft.selectedRaceIds.length ||
                      window.confirm(
                        "Descartar o rascunho atual e iniciar uma nova solicitação?",
                      )
                    )
                      try {
                        await restart();
                        window.location.assign("/corridas");
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : "Não foi possível iniciar outra solicitação.",
                        );
                      }
                  }}
                >
                  Nova solicitação
                </button>
              </div>
            )}
          </section>

          <Link
            className="button"
            reloadDocument={next.startsWith("/corridas")}
            to={next}
            onClick={clearContinuation}
          >
            Continuar →
          </Link>
        </>
      ) : (
        <section className="panel narrow">
          <h2>Acesse seus dados e participantes</h2>
          <p>
            Entre ou crie sua conta para reutilizar seus cadastros nas próximas
            solicitações. Antes de entrar, a seleção e a quantidade ficam nesta
            aba por 30 minutos. Dados pessoais ainda não salvos precisam ser
            preenchidos novamente após trocar de página.
          </p>
          <div className="account-actions">
            <button
              className="button"
              type="button"
              disabled={busy}
              onClick={() => enter("login")}
            >
              Entrar
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={busy}
              hidden={!account.registrationEnabled}
              onClick={() => enter("register")}
            >
              Criar minha conta
            </button>
          </div>
          <button
            className="text-button"
            type="button"
            disabled={busy}
            onClick={() => enter("recover")}
          >
            Esqueci minha senha
          </button>
          {!account.registrationEnabled && (
            <p>O cadastro está indisponível na página Minha conta.</p>
          )}
          <p className="field-help">
            O acesso e a recuperação de senha são realizados no WordPress da Re
            Almeida Kits.
          </p>
        </section>
      )}
    </div>
  );
}
