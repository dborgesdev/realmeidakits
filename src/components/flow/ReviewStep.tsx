import { Link } from "react-router-dom";
import { events } from "../../data/events";
import { useDemo } from "../../state/DemoContext";
import { requiredDocuments } from "../../state/requestRules";
import OrderSummary from "./OrderSummary";
export default function ReviewStep() {
  const { draft } = useDemo();
  return (
    <>
      <h1>Todas as corridas, uma solicitação</h1>
      <p>
        Confira cada item. O pagamento será apenas uma simulação consolidada.
      </p>
      <div className="soft inset">
        <h2>Participante de demonstração</h2>
        <p>{draft.person.name} · CPF ***.***.***-**</p>
        <p>
          Nascimento **/**/**** · Telefone DEMO-TELEFONE · E-mail do perfil
          fictício
        </p>
        <Link className="text-link" to="/solicitacao/dados">
          Editar dados pessoais
        </Link>
      </div>
      <OrderSummary items={draft.items} method={draft.method} editable />
      <fieldset className="form-section">
        <legend>Conferência por corrida</legend>
        {draft.items.map((item) => {
          const race = events.find((r) => r.id === item.raceId)!;
          return (
            <article className="review-requirements" key={race.id}>
              <h3>{race.name}</h3>
              <p>
                Documentos de exemplo:{" "}
                {requiredDocuments(item, race)
                  .map((d) => d.label)
                  .join(", ") || "nenhum configurado"}
                .
              </p>
              <p className="success">
                ✓ Requisitos demonstrativos atendidos · {race.conditions.length}{" "}
                condição(ões) aceita(s)
              </p>
            </article>
          );
        })}
        <div className="actions">
          <Link className="text-link" to="/solicitacao/documentos">
            Rever documentos
          </Link>
          <Link className="text-link" to="/solicitacao/condicoes">
            Rever condições
          </Link>
        </div>
      </fieldset>
      <div className="notice">
        Nenhum documento foi analisado, pagamento cobrado ou pedido criado.
      </div>
    </>
  );
}
