import { useSearchParams, useParams } from "react-router-dom";
import { events, asset } from "../data/events";
import EventCard from "../components/EventCard";
import { DemoNotice, PageTitle } from "../components/UI";
import SelectionSummary from "../components/selection/SelectionSummary";
import { useDemo } from "../state/DemoContext";
import { availabilityLabel, isAvailable } from "../state/selectionRules";
import NotFound from "./NotFound";
export default function EventsPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const event = events.find((e) => e.slug === slug);
  const { draft, toggleRace } = useDemo();
  if (slug && !event) return <NotFound />;
  const preferred = params.get("modalidade") === "appai" ? "appai" : undefined;
  return (
    <div className="flow-shell">
      <div className="container page">
        <DemoNotice />
        {event ? (
          <>
            <PageTitle eyebrow="EVENTO DE DEMONSTRAÇÃO" title={event.name}>
              {event.description}
            </PageTitle>
            <div className="detail-grid">
              <img
                className="detail-image"
                src={asset(event.image)}
                alt={`Imagem conceitual de ${event.name}`}
                width="800"
                height="600"
              />
              <div className="panel">
                <span
                  className={`availability ${isAvailable(event) ? "available" : "closed"}`}
                >
                  {availabilityLabel(event)}
                </span>
                <h2>Uma corrida, suas próprias opções</h2>
                <p>
                  Datas, valores e requisitos abaixo são exemplos, sem oferta
                  real.
                </p>
                {event.closesAt && (
                  <p>
                    Prazo ilustrativo:{" "}
                    {new Date(event.closesAt).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}
                    (Brasília).
                  </p>
                )}
                <p>Distâncias: {event.distances.join(" / ")}.</p>
                {event.modalities.map((mode) => (
                  <section key={mode.id}>
                    <h3>{mode.label}</h3>
                    <ul>
                      {mode.documents.map((doc) => (
                        <li key={doc.id}>
                          {doc.label}
                          {doc.scope === "personal"
                            ? " · reutilizável pela participante"
                            : " · específica desta corrida"}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <p>{event.guidance}</p>
                {event.conditions.map((c) => (
                  <p key={c.id} className="caption">
                    Condição demonstrativa: {c.text}
                  </p>
                ))}
                {event.whatsappUrl && (
                  <a
                    href={event.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Grupo da corrida
                  </a>
                )}
                <button
                  className="button"
                  disabled={
                    !isAvailable(event) &&
                    !draft.items.some((i) => i.raceId === event.id)
                  }
                  onClick={() => toggleRace(event, preferred)}
                >
                  {draft.items.some((i) => i.raceId === event.id)
                    ? "Remover da seleção"
                    : isAvailable(event)
                      ? "Adicionar à minha seleção"
                      : "Prazo encerrado"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <PageTitle
              eyebrow="UMA PARTICIPANTE · VÁRIAS CORRIDAS"
              title="Escolha suas corridas"
            >
              Selecione uma ou várias provas e configure cada uma antes de
              simular um pagamento único. Todos os eventos, prazos e valores são
              ilustrativos.
            </PageTitle>
            {preferred && (
              <p className="notice">
                Você veio pelo caminho APPAI. A modalidade estará disponível
                somente nas corridas que a oferecem.
              </p>
            )}
            <div className="grid three">
              {events.map((e) => (
                <EventCard key={e.id} event={e} preferred={preferred} />
              ))}
            </div>
          </>
        )}
        <SelectionSummary />
      </div>
    </div>
  );
}
