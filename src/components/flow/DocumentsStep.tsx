import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { requiredDocuments } from "../../state/requestRules";
import { modalityLabel } from "../../state/pricing";
import DocumentPicker from "./DocumentPicker";
import RaceFields from "./RaceFields";
export default function DocumentsStep() {
  const { draft, setDraft, updateItem } = useDemo();
  const personal = Array.from(
    new Map(
      draft.items.flatMap((item) =>
        requiredDocuments(
          item,
          events.find((r) => r.id === item.raceId)!,
        )
          .filter((doc) => doc.scope === "personal")
          .map((doc) => [doc.id, doc] as const),
      ),
    ).values(),
  );
  function fillExamples() {
    setDraft((d) => ({
      ...d,
      order: undefined,
      sharedDocuments: {
        ...d.sharedDocuments,
        ...Object.fromEntries(
          personal.map((doc) => [doc.id, "Documento pessoal de exemplo"]),
        ),
      },
      items: d.items.map((item) => ({
        ...item,
        documents: Object.fromEntries(
          requiredDocuments(
            item,
            events.find((r) => r.id === item.raceId)!,
          )
            .filter((doc) => doc.scope === "race")
            .map((doc) => [doc.id, "Documento específico de exemplo"]),
        ),
      })),
    }));
  }
  return (
    <>
      <h1>Dados e documentos por corrida</h1>
      <p>
        Identificação geral pode ser reutilizada pela mesma participante.
        Autorizações e comprovantes ficam vinculados a cada prova, sem
        reaproveitamento automático entre corridas.
      </p>
      <button type="button" className="button secondary" onClick={fillExamples}>
        Usar todos os documentos de exemplo
      </button>
      {personal.length > 0 && (
        <fieldset className="form-section">
          <legend>Documentos pessoais</legend>
          <p>Selecione uma vez para as corridas que exigem este documento.</p>
          {personal.map((doc) => (
            <DocumentPicker
              key={doc.id}
              label={doc.label}
              value={draft.sharedDocuments[doc.id]}
              onChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  order: undefined,
                  sharedDocuments: { ...d.sharedDocuments, [doc.id]: value },
                }))
              }
            />
          ))}
        </fieldset>
      )}
      {draft.items.map((item) => {
        const race = events.find((r) => r.id === item.raceId)!;
        const docs = requiredDocuments(item, race).filter(
          (doc) => doc.scope === "race",
        );
        return (
          <fieldset className="form-section" key={race.id}>
            <legend>{race.name}</legend>
            <span className="badge">{modalityLabel(item)} · DEMONSTRAÇÃO</span>
            <RaceFields race={race} item={item} />
            {docs.map((doc) => (
              <DocumentPicker
                key={doc.id}
                label={`${doc.label} — ${race.name}`}
                value={item.documents[doc.id]}
                onChange={(value) =>
                  updateItem(race.id, {
                    documents: { ...item.documents, [doc.id]: value },
                  })
                }
              />
            ))}
            {!docs.length && (
              <p className="success">
                Esta modalidade não exige documentos específicos no exemplo.
              </p>
            )}
            <p className="caption">{race.guidance}</p>
          </fieldset>
        );
      })}
    </>
  );
}
