import { useEffect, useState } from "react";
import { useAccount } from "../../state/AccountContext";
import PrivateDocumentField, {
  type DocumentConfiguration,
} from "./PrivateDocumentField";
import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import { configuredDocuments } from "../../state/requestRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import DocumentRequirementInfo from "./DocumentRequirementInfo";
export default function DocumentsStep() {
  const { events } = useCatalog();
  const { request } = useAccount();
  const { draft, persistence } = useRequest();
  const [available, setAvailable] = useState<string[]>([]);
  const saved = persistence.status === "saved";
  useEffect(() => {
    if (!saved) return;
    let active = true;
    request<{ available: string[] }>(
      "/account/draft/identity-availability",
      "POST",
      {},
    )
      .then((result) => {
        if (active) setAvailable(result.available);
      })
      .catch(() => {
        if (active) setAvailable([]);
      });
    return () => {
      active = false;
    };
  }, [request, saved]);
  const [configuration, setConfiguration] =
    useState<DocumentConfiguration | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let active = true;
    request<DocumentConfiguration>("/account/draft/documents")
      .then((result) => {
        if (active) setConfiguration(result);
      })
      .catch(() => {
        if (active) setConfiguration(null);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [request, attempt]);
  return (
    <>
      <h1>Documentos de cada participante</h1>
      <p>
        Confira as exigências da modalidade escolhida e baixe os modelos quando
        disponíveis.
      </p>
      <ParticipantPanels
        participants={draft.participants}
        describe={() => "Documentos exigidos"}
      >
        {(p, next) => (
          <>
            {p.items.map((item) => {
              const race = events.find((r) => r.id === item.raceId)!;
              const docs = configuredDocuments(item, race);
              return (
                <fieldset className="form-section" key={race.id}>
                  <legend>{race.name}</legend>
                  {docs.map((doc) => (
                    <div key={doc.id}>
                      <DocumentRequirementInfo document={doc} />
                      {doc.requiresUpload !== false && (
                        <PrivateDocumentField
                          participant={p}
                          item={item}
                          document={doc}
                          canReuse={available.includes(p.id)}
                          configuration={configuration}
                          checking={checking}
                          retry={() => {
                            setChecking(true);
                            setAttempt((value) => value + 1);
                          }}
                        />
                      )}
                    </div>
                  ))}
                  {!docs.length && (
                    <p>Sem exigência documental para esta modalidade.</p>
                  )}
                </fieldset>
              );
            })}
            {next && (
              <button type="button" className="button secondary" onClick={next}>
                Próximo participante
              </button>
            )}
          </>
        )}
      </ParticipantPanels>
    </>
  );
}
