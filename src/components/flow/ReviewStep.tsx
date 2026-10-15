import type { Race } from "../../data/events";
import { Link } from "react-router-dom";
import { useDemo } from "../../state/DemoContext";
export default function ReviewStep({ event }: { event: Race }) {
  const { draft } = useDemo();
  return (
    <>
      <h1>Está tudo certo?</h1>
      <p>Revise os dados antes de conhecer a simulação de pagamento.</p>
      <dl className="summary">
        <dt>Corrida</dt>
        <dd>{event.name} · DEMONSTRAÇÃO</dd>
        <dt>Modalidade</dt>
        <dd>
          {draft.modality === "appai" ? "Associado à APPAI" : "Kit oficial"}
        </dd>
        <dt>Participante</dt>
        <dd>{draft.name} · CPF ***.***.***-**</dd>
        {draft.modality === "appai" && (
          <>
            <dt>Matrícula / opção</dt>
            <dd>
              {draft.membership} ·{" "}
              {draft.kit === "camiseta"
                ? `Camiseta ${draft.size} com número de peito`
                : "Somente número de peito"}
            </dd>
          </>
        )}
        {event.birthDateRequired && (
          <>
            <dt>Nascimento do exemplo</dt>
            <dd>**/**/**** · informado</dd>
          </>
        )}
        {event.phoneRequired && (
          <>
            <dt>Telefone do exemplo</dt>
            <dd>DEMO-TELEFONE</dd>
          </>
        )}
        <dt>Documentos fictícios</dt>
        <dd>{Object.keys(draft.documents).join(", ")}</dd>
        <dt>Valor do serviço</dt>
        <dd>A confirmar · Não há cobrança nesta prévia</dd>
      </dl>
      <div className="actions">
        <Link className="text-link" to={`/solicitacao/${draft.slug}/dados`}>
          Editar dados
        </Link>
        <Link
          className="text-link"
          to={`/solicitacao/${draft.slug}/documentos`}
        >
          Rever documentos
        </Link>
      </div>
      <div className="notice">Prévia: nenhum pagamento será cobrado.</div>
    </>
  );
}
