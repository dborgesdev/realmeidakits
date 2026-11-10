import { useEffect } from "react";
import { useRequest } from "../../state/RequestContext";

export default function DraftStatus({ stage }: { stage?: string }) {
  const { setStage, persistence } = useRequest();
  useEffect(() => {
    if (stage) setStage(stage);
  }, [setStage, stage]);
  if (persistence.status === "loading")
    return <p role="status">Carregando rascunho…</p>;
  if (persistence.status === "saving")
    return <p role="status">Salvando rascunho…</p>;
  if (persistence.status === "saved")
    return <p role="status">Rascunho salvo.</p>;
  if (persistence.status !== "error") return null;
  return (
    <div className="error-summary">
      <p role="alert">{persistence.error}</p>
      <button type="button" className="text-button" onClick={persistence.retry}>
        Tentar novamente
      </button>
      <button
        type="button"
        className="text-button"
        onClick={() => window.location.reload()}
      >
        Recarregar a versão salva
      </button>
    </div>
  );
}
