import { useSearchParams, useParams } from "react-router-dom";
import { events, asset } from "../data/events";
import EventCard from "../components/EventCard";
import { Action, DemoNotice, PageTitle } from "../components/UI";
import NotFound from "./NotFound";
export default function EventsPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const query = params.get("modalidade") === "appai" ? "?modalidade=appai" : "";
  const event = events.find((e) => e.slug === slug);
  if (slug && !event) return <NotFound />;
  return (
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
              <h2>Sua retirada começa aqui</h2>
              <p>
                Data, local, horários e valores: a confirmar. Nenhuma oferta
                comercial nesta prévia.
              </p>
              <h3>Documentos do exemplo</h3>
              <ul>
                <li>Comprovante de inscrição</li>
                <li>Documento com foto</li>
                {event.authorization && (
                  <li>Autorização específica de retirada</li>
                )}
              </ul>
              <p>Modalidades: Kit oficial e Associado à APPAI.</p>
              <p>
                Entrega e grupo WhatsApp serão informados quando confirmados.
              </p>
              <Action to={`/solicitacao/${event.slug}/modalidade${query}`}>
                Solicitar retirada
              </Action>
            </div>
          </div>
        </>
      ) : (
        <>
          <PageTitle
            eyebrow="ESCOLHA SUA PRÓXIMA ETAPA"
            title="Corridas disponíveis"
          >
            Explore três exemplos. Ainda não há eventos atuais confirmados nesta
            prévia.
          </PageTitle>
          <div className="grid three">
            {events.map((e) => (
              <EventCard key={e.slug} event={e} query={query} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
