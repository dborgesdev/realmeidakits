import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAccount } from "../state/AccountContext";
import PersonForm from "../components/account/PersonForm";
import ParticipantDirectory from "../components/account/ParticipantDirectory";
export default function AccountPage() {
  const account = useAccount();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function enter(intent: "login" | "register" | "recover") {
    setBusy(true);
    try {
      await account.login(intent, params.get("continuar") || "/conta");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível abrir o acesso.",
      );
      setBusy(false);
    }
  }
  if (account.status === "loading")
    return (
      <div className="container page narrow">
        <h1>Minha conta</h1>
        <p role="status">Conectando sua conta…</p>
      </div>
    );
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
      {account.profile ? (
        <>
          <section className="panel">
            <div className="account-actions">
              <h2>Dados do titular</h2>
              <button
                type="button"
                className="button secondary small"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await account.logout();
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
          <ParticipantDirectory />
          <Link
            className="button"
            to={
              params.get("continuar")?.startsWith("/solicitacao/")
                ? params.get("continuar")!
                : "/corridas"
            }
          >
            Continuar para as corridas →
          </Link>
        </>
      ) : (
        <section className="panel narrow">
          <h2>Acesse seus dados e participantes</h2>
          <p>
            Entre ou crie sua conta para reutilizar seus cadastros nas próximas
            solicitações.
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
          <p className="field-help">
            O acesso e a recuperação de senha são realizados no WordPress da Re
            Almeida Kits.
          </p>
        </section>
      )}
    </div>
  );
}
