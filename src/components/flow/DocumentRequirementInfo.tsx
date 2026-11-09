import type { DocumentRequirement } from "../../types/domain";
export default function DocumentRequirementInfo({
  document: doc,
}: {
  document: DocumentRequirement;
}) {
  return (
    <section
      className="document-requirement-info"
      aria-label={`Orientações: ${doc.label}`}
    >
      <h3>
        {doc.label} {doc.required === false ? <small>· opcional</small> : null}
      </h3>
      {doc.guidance && <p className="field-help">{doc.guidance}</p>}
      {doc.template && (
        <a
          className="button secondary small"
          href={doc.template.url}
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          {doc.purpose?.toLocaleLowerCase("pt-BR").includes("autoriza")
            ? "Baixar modelo de autorização"
            : "Baixar modelo do documento"}
        </a>
      )}
      {doc.template && (
        <p className="caption">
          Modelo público em branco. O documento preenchido/assinado é pessoal.
        </p>
      )}
      {doc.requiresUpload === false && (
        <p className="field-help">
          Não exige envio de arquivo nesta configuração.
        </p>
      )}
      {doc.scope === "personal" && doc.requiresUpload !== false && (
        <p className="caption">
          Use o campo de documento pessoal deste participante. As instruções
          acima se aplicam a esta corrida.
        </p>
      )}
    </section>
  );
}
