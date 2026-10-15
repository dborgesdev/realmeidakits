const labels = [
  "Modalidade",
  "Identificação",
  "Dados",
  "Documentos",
  "Revisão",
  "Pagamento",
  "Confirmação",
];
export default function Progress({ step }: { step: number }) {
  return (
    <nav className="progress" aria-label="Etapas da solicitação">
      <ol>
        {labels.map((label, i) => (
          <li
            key={label}
            aria-label={`${i + 1}. ${label}${i < step ? ", concluída" : ""}`}
            aria-current={i === step ? "step" : undefined}
            className={i <= step ? "reached" : ""}
          >
            <span>{i < step ? "✓" : i + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>
      <p>
        Etapa {step + 1} de 7 · {labels[step]}
      </p>
    </nav>
  );
}
