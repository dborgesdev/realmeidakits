import { useEffect } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { events, asset } from "../data/events";
import RaceDetailHero from "../components/RaceDetailHero";
import { groupUrl } from "../state/voucherRules";
import EventCard from "../components/EventCard";
import { DemoNotice, PageTitle } from "../components/UI";
import SelectionSummary from "../components/selection/SelectionSummary";
import { useDemo } from "../state/DemoContext";
import { availabilityLabel, isAvailable } from "../state/selectionRules";
import NotFound from "./NotFound";
export default function EventsPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const event = events.find((e) => e.slug === slug);
  const { draft, toggleRace, restart, prefer } = useDemo();
  const entry = params.get("modalidade");
  useEffect(() => {
    if (entry !== "appai" && entry !== "oficial") return;
    prefer(entry);
    // Consume the shortcut so refreshing or starting another order cannot replay it.
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("modalidade");
        return next;
      },
      { replace: true },
    );
  }, [entry, prefer, setParams]);
  if (slug && !event) return <NotFound />;
  const preferred = draft.preferredModality;
  return (
    <div className="flow-shell">
      <div className="container page">
        <DemoNotice />
        {draft.order && (
          <div className="notice">
            Seu pedido demonstrativo foi finalizado.{" "}
            <Link to="/conclusao">Ver conclusão</Link> ou{" "}
            <Link
              className="button secondary small"
              to="/corridas"
              onClick={restart}
            >
              Nova inscrição
            </Link>
            .
          </div>
        )}
        {event ? (
          <>
            <RaceDetailHero race={event} />
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
                            ? " · reutilizável pelo participante"
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
                {groupUrl(event) && (
                  <a
                    href={groupUrl(event)!}
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
                    (!draft.selectedRaceIds.includes(event.id) ||
                      Boolean(draft.order))
                  }
                  onClick={() => toggleRace(event)}
                >
                  {!draft.order && draft.selectedRaceIds.includes(event.id)
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
              eyebrow="PARA VOCÊ OU MAIS PESSOAS"
              title="Escolha suas corridas"
            >
              Selecione uma ou várias provas e configure cada uma antes de
              simular um pagamento único. Todos os eventos, prazos e valores são
              ilustrativos.
            </PageTitle>
            {preferred && (
              <p className="notice">
                Preferência inicial:{" "}
                {preferred === "appai" ? "Associado à APPAI" : "Kit Oficial"}.
                Você pode alterar a modalidade de cada participante e corrida,
                conforme as opções disponíveis. Configurações já preenchidas são
                preservadas.
              </p>
            )}
            <div className="grid three">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        )}
        <SelectionSummary />
      </div>
    </div>
  );
}
