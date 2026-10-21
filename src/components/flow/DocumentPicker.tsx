import { useId, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { fileError } from "../../state/rules";
export default function DocumentPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [error, setError] = useState("");
  const id = useId();
  return (
    <div className="upload">
      <label htmlFor={id}>
        <span>
          {value ? <FileCheck2 /> : <Upload />}
          {label}
        </span>
      </label>
      <p id={`${id}-help`} className="field-help">
        PDF, JPG ou PNG fictício, até 5 MB. O conteúdo não é lido, transmitido
        ou armazenado.
      </p>
      <div className="document-actions">
        <button
          type="button"
          className="button secondary small"
          onClick={() => {
            onChange(
              value
                ? "Documento fictício atualizado"
                : "Documento de exemplo disponível",
            );
            setError("");
          }}
        >
          {value ? "Substituir por exemplo" : "Usar exemplo"}
        </button>
        <input
          id={id}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
          aria-invalid={Boolean(error)}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const message = fileError(file);
            setError(message);
            if (!message) onChange("Arquivo fictício selecionado");
            e.target.value = "";
          }}
        />
      </div>
      {value ? (
        <p className="success" aria-live="polite">
          ✓ {value}{" "}
          <button
            type="button"
            className="text-button"
            aria-label={`Remover ${label}`}
            onClick={() => {
              onChange("");
              setError("");
            }}
          >
            Remover
          </button>
        </p>
      ) : (
        <p className="caption">Pendente</p>
      )}
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
