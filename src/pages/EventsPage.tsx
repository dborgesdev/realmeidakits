import { useEffect } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useCatalog } from "../state/CatalogContext";
import { asset } from "../data/assets";
import RaceDetailHero from "../components/RaceDetailHero";
import { groupUrl } from "../state/voucherRules";
import EventCard from "../components/EventCard";
import { PageTitle } from "../components/UI";
import SelectionSummary from "../components/selection/SelectionSummary";
import { useRequest } from "../state/RequestContext";
import { availabilityLabel, isAvailable } from "../state/selectionRules";
import NotFound from "./NotFound";
import RaceImage from "../components/RaceImage";
export default function EventsPage() {
  const { events } = useCatalog();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const event = events.find((e) => e.slug === slug);
  const { draft, toggleRace, restart, prefer } = useRequest();
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
        {draft.order && (
          <div className="notice">
            Seu pedido foi finalizado.{" "}
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
              {event.image ? (
                <RaceImage
                  className="detail-image"
                  src={asset(event.image)}
                  alt={`Imagem de ${event.name}`}
                  width="800"
                  height="600"
                />
              ) : (
                <div className="panel">Imagem ainda não cadastrada.</div>
              )}
              <div className="panel">
                <span
                  className={`availability ${isAvailable(event) ? "available" : "closed"}`}
                >
                  {availabilityLabel(event)}
                </span>
                <h2>Uma corrida, suas próprias opções</h2>
                <p>
                  Confira modalidades, documentos e orientações desta corrida.
                </p>
                {event.closesAt && (
                  <p>
                    Prazo:{" "}
                    {new Date(event.closesAt).toLocaleString("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                    })}{" "}
                    (Brasília).
                  </p>
                )}
                <p>Distâncias: {event.distances.join(" / ")}.</p>
                {event.location && (
                  <p>
                    Local da corrida: {event.location}
                    {event.raceTime ? ` · ${event.raceTime}` : ""}.
                  </p>
                )}
                {event.modalities.map((mode) => (
                  <section key={mode.id}>
                    <h3>{mode.label}</h3>
                    {mode.distances && (
                      <p>Distâncias: {mode.distances.join(" / ")}</p>
                    )}
                    {mode.shirtImage && (
                      <RaceImage
                        className="shirt-preview"
                        src={mode.shirtImage}
                        alt={`Camiseta de ${event.name}`}
                        width="400"
                        height="400"
                        loading="lazy"
                      />
                    )}
                    <ul>
                      {mode.documents.map((doc) => (
                        <li key={doc.id}>
                          {doc.label}
                          {doc.required === false ? " · opcional" : ""}
                          {doc.scope === "personal"
                            ? " · reutilizável pelo participante"
                            : " · específica desta corrida"}
                          {doc.guidance && <p>{doc.guidance}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <p>{event.guidance}</p>
                {event.contact && <p>{event.contact}</p>}
                {event.conditions.map((c) => (
                  <p key={c.id} className="caption">
                    {`Condição · versão ${c.version}: `}
                    {c.text}
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
              Selecione uma ou várias corridas e configure as opções de cada
              participante.
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
              {!events.length && (
                <p role="status">Nenhuma corrida publicada no momento.</p>
              )}
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
