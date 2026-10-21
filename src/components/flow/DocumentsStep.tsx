import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { requiredDocuments } from "../../state/requestRules";
import ParticipantPanels from "../participants/ParticipantPanels";
import { controlId, missingDocuments } from "../../state/validationRules";
import DocumentPicker from "./DocumentPicker";
export default function DocumentsStep() {
  const { draft, setDraft, updateItem } = useDemo();
  function personal(id: string, doc: string, value: string) {
    setDraft((d) => ({
      ...d,
      participants: d.participants.map((p) =>
        p.id === id ? { ...p, documents: { ...p.documents, [doc]: value } } : p,
      ),
    }));
  }
  return (
    <>
      <h1>Documentos de cada participante</h1>
      <p>
        Somente exemplos. Nenhum conteúdo é lido, enviado ou armazenado.
        Identificação pessoal pertence à pessoa; comprovantes e autorizações
        pertencem a cada corrida.
      </p>
      <ParticipantPanels
        participants={draft.participants}
        describe={(p) => {
          const count = missingDocuments(p, events);
          return count
            ? `! ${count} documento${count === 1 ? "" : "s"} pendente${count === 1 ? "" : "s"}`
            : "✓ Completo · documentos de exemplo";
        }}
      >
        {(p, next) => {
          const docs = Array.from(
            new Map(
              p.items.flatMap((item) =>
                requiredDocuments(
                  item,
                  events.find((r) => r.id === item.raceId)!,
                )
                  .filter((d) => d.scope === "personal")
                  .map((d) => [d.id, d] as const),
              ),
            ).values(),
          );
          return (
            <>
              {docs.length > 0 && (
                <fieldset className="form-section">
                  <legend>Documentos pessoais · {p.person.name}</legend>
                  {p.existingDocumentIds.length > 0 && (
                    <div className="notice">
                      <p>
                        Já existe um documento cadastrado para este
                        participante.
                      </p>
                      <p>
                        Este cenário usa um registro fictício. A pessoa
                        responsável não pode visualizar nem baixar documentos
                        privados.
                      </p>
                      <label className="radio">
                        <input
                          type="checkbox"
                          checked={p.reuseAuthorized}
                          onChange={(e) => {
                            const authorized = e.target.checked;
                            setDraft((d) => ({
                              ...d,
                              participants: d.participants.map((person) =>
                                person.id === p.id
                                  ? {
                                      ...person,
                                      reuseAuthorized: authorized,
                                      documents: {
                                        ...person.documents,
                                        ...Object.fromEntries(
                                          person.existingDocumentIds.map(
                                            (id) => [
                                              id,
                                              authorized
                                                ? "Documento fictício reutilizado com autorização"
                                                : "",
                                            ],
                                          ),
                                        ),
                                      },
                                    }
                                  : person,
                              ),
                            }));
                          }}
                        />
                        Autorizo reutilizar o documento fictício deste
                        participante
                      </label>
                    </div>
                  )}
                  {docs.map((d) => (
                    <DocumentPicker
                      key={d.id}
                      controlId={controlId("document", p.id, undefined, d.id)}
                      label={d.label}
                      value={p.documents[d.id]}
                      onChange={(value) => personal(p.id, d.id, value)}
                    />
                  ))}
                </fieldset>
              )}
              {p.items.map((item) => {
                const race = events.find((r) => r.id === item.raceId)!;
                const specific = requiredDocuments(item, race).filter(
                  (d) => d.scope === "race",
                );
                return (
                  <fieldset className="form-section" key={race.id}>
                    <legend>{race.name}</legend>
                    {specific.map((d) => (
                      <DocumentPicker
                        key={d.id}
                        controlId={controlId("document", p.id, race.id, d.id)}
                        label={d.label}
                        value={item.documents[d.id]}
                        onChange={(value) =>
                          updateItem(p.id, race.id, {
                            documents: { ...item.documents, [d.id]: value },
                          })
                        }
                      />
                    ))}
                    {!specific.length && (
                      <p>Sem documento específico neste exemplo.</p>
                    )}
                  </fieldset>
                );
              })}
              {next && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={next}
                >
                  Próximo participante
                </button>
              )}
            </>
          );
        }}
      </ParticipantPanels>
    </>
  );
}
