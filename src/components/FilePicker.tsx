import { useState } from "react";

export default function FilePicker({
  label,
  accept,
  disabled,
  onFile,
}: {
  label: string;
  accept: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="file-picker">
      <span className="file-picker-title">{label}</span>
      <label className="file-picker-control">
        <span aria-hidden="true">Escolher arquivo</span>
        <input
          type="file"
          aria-label={`Escolher arquivo: ${label}`}
          accept={accept}
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setName(file.name);
            onFile(file);
          }}
        />
      </label>
      <span className="file-picker-name" role="status">
        {name || "Nenhum arquivo selecionado"}
      </span>
    </div>
  );
}
