import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { fileError } from "../../state/rules";
import { useDemo } from "../../state/DemoContext";
import { requiredDocuments } from "../../state/requestRules";
export default function DocumentsStep({
  authorization,
}: {
  authorization: boolean;
}) {
  const { draft, setDraft } = useDemo();
  const [error, setError] = useState("");
  const required = requiredDocuments(authorization);
  return (
    <>
      <h1>Documentos para esta corrida</h1>
      <p>
        Use os exemplos prontos ou selecione arquivos fictícios PDF, JPG ou PNG
        (até 5 MB). Nada será transmitido; o conteúdo dos arquivos não é lido
        nem guardado.
      </p>
      <button
        type="button"
        className="button secondary"
        onClick={() => {
          setDraft({
            ...draft,
            confirmed: false,
            documents: Object.fromEntries(
              required.map((k) => [k, "Documento fictício pronto"]),
            ),
          });
          setError("");
        }}
      >
        Usar documentos de exemplo
      </button>
      <div className="upload-list">
        {required.map((k) => (
          <div className="upload" key={k}>
            <label>
              <span>
                {draft.documents[k] ? <FileCheck2 /> : <Upload />} {k}
              </span>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const message = fileError(f);
                  setError(message);
                  if (!message)
                    setDraft({
                      ...draft,
                      confirmed: false,
                      documents: {
                        ...draft.documents,
                        [k]: "Arquivo fictício selecionado",
                      },
                    });
                  e.target.value = "";
                }}
              />
            </label>
            {draft.documents[k] && (
              <small className="success">
                ✓ {draft.documents[k]}{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    const docs = { ...draft.documents };
                    delete docs[k];
                    setDraft({ ...draft, confirmed: false, documents: docs });
                  }}
                >
                  Remover
                </button>
              </small>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {authorization && (
        <label className="radio">
          <input
            type="checkbox"
            required
            checked={draft.authorized}
            onChange={(e) =>
              setDraft({
                ...draft,
                confirmed: false,
                authorized: e.target.checked,
              })
            }
          />{" "}
          Entendi que a autorização é específica desta corrida e permite a
          retirada física pela Re Almeida.
        </label>
      )}
      <p className="caption">
        Obrigatórios: {required.length} documentos do exemplo. O fluxo só avança
        quando todos estiverem selecionados.
      </p>
    </>
  );
}
