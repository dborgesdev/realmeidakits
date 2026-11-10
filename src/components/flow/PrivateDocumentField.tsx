import { useState } from "react";
import type {
  DocumentRequirement,
  Participant,
  RaceSelection,
} from "../../types/domain";
import { useAccount } from "../../state/AccountContext";
import { useRequest } from "../../state/RequestContext";
import { controlId } from "../../state/validationRules";
import { FieldError, useFlowFeedback } from "./FlowFeedback";

export type DocumentConfiguration = { enabled: boolean; maxBytes: number };

export default function PrivateDocumentField({
  participant,
  item,
  document,
  canReuse,
  configuration,
  checking,
  retry,
}: {
  participant: Participant;
  item: RaceSelection;
  document: DocumentRequirement;
  canReuse: boolean;
  configuration: DocumentConfiguration | null;
  checking: boolean;
  retry: () => void;
}) {
  const { request } = useAccount();
  const { persistence } = useRequest();
  const { field } = useFlowFeedback();
  const [operation, setOperation] = useState("");
  const [error, setError] = useState("");
  const token = item.documents[document.id];
  const personal = document.id === "rak-personal-identity";
  const reused = token?.startsWith("reuse-");
  const target = controlId(
    "document",
    participant.id,
    item.raceId,
    document.id,
  );
  const editable =
    !checking &&
    !!configuration?.enabled &&
    !!participant.directoryId &&
    persistence.status === "saved" &&
    !persistence.documentBusy &&
    !operation;

  async function run(label: string, action: () => Promise<void>) {
    setOperation(label);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setOperation("");
    }
  }

  async function upload(file?: File) {
    const body = new FormData();
    body.set("slot", participant.id);
    body.set("race", item.raceId);
    body.set("requirement", document.id);
    if (!file) {
      body.set("reuse", "1");
      await persistence.changeDocument("POST", body);
      return;
    }
    if (!configuration || file.size < 1 || file.size > configuration.maxBytes) {
      throw new Error("O arquivo está vazio ou excede o limite permitido.");
    }
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      throw new Error("Escolha um arquivo PDF, JPG ou PNG.");
    }
    body.set("file", file);
    await persistence.changeDocument("POST", body);
  }

  async function download() {
    const file = await request<Blob>(
      "/account/draft/documents/" + token,
      "GET",
      undefined,
      true,
    );
    const extension =
      file.type === "application/pdf"
        ? "pdf"
        : file.type === "image/png"
          ? "png"
          : "jpg";
    const url = URL.createObjectURL(file);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "documento." + extension;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div {...field(target)} tabIndex={-1} aria-busy={!!operation}>
      <label>
        {token ? "Substituir " : "Anexar "}
        {document.label}
        <input
          type="file"
          accept={personal ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png"}
          disabled={!editable}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void run("Enviando documento…", () => upload(file));
          }}
        />
      </label>
      <FieldError id={target} />
      {personal && canReuse && !reused && (
        <div className="account-actions">
          <p>Há uma identificação disponível para esta pessoa.</p>
          <button
            type="button"
            className="button secondary small"
            disabled={
              !participant.directoryId ||
              persistence.status !== "saved" ||
              persistence.documentBusy ||
              !!operation
            }
            onClick={() =>
              void run("Confirmando reutilização…", () => upload())
            }
          >
            Confirmar uso da identificação nesta solicitação
          </button>
        </div>
      )}
      {checking && <p role="status">Verificando o serviço de envio…</p>}
      {!checking && !configuration?.enabled && (
        <div>
          <p role="alert">
            Não foi possível acessar o serviço de envio. Os dados da solicitação
            continuam no rascunho. Tente novamente ou fale com o atendimento.
          </p>
          <button type="button" className="text-button" onClick={retry}>
            Verificar novamente
          </button>
        </div>
      )}
      {configuration?.enabled && !participant.directoryId && (
        <p className="field-help">
          Salve o cadastro do participante antes de anexar.
        </p>
      )}
      {configuration?.enabled && (
        <p className="field-help">
          {personal ? "JPG ou PNG" : "PDF, JPG ou PNG"}, até{" "}
          {(configuration.maxBytes / (1024 * 1024)).toLocaleString("pt-BR")} MB.
        </p>
      )}
      {token && (
        <div className="account-actions">
          <p role="status">
            {reused
              ? "Reutilização confirmada para esta solicitação."
              : "Documento enviado. A análise acontece depois."}
          </p>
          {!reused && (
            <button
              type="button"
              className="text-button"
              disabled={!!operation}
              onClick={() => void run("Baixando documento…", download)}
            >
              Baixar arquivo
            </button>
          )}
          <button
            type="button"
            className="text-button"
            disabled={
              persistence.status !== "saved" ||
              persistence.documentBusy ||
              !!operation
            }
            onClick={() => {
              if (window.confirm("Remover este documento do rascunho?"))
                void run("Removendo documento…", () =>
                  persistence.changeDocument("DELETE", token),
                );
            }}
          >
            Remover arquivo
          </button>
        </div>
      )}
      {operation && (
        <p role="status">
          <progress aria-label={operation} /> {operation}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
