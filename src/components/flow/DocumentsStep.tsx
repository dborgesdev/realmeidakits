import { useCatalog } from "../../state/CatalogContext";
import { useRequest } from "../../state/RequestContext";
import { configuredDocuments } from "../../state/requestRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import DocumentRequirementInfo from "./DocumentRequirementInfo";
export default function DocumentsStep() {
  const { events } = useCatalog();
  const { draft } = useRequest();
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
                        <p className="field-help">
                          Envio de arquivo ainda indisponível.
                        </p>
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
