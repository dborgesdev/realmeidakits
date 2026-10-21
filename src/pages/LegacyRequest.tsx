import { Navigate, useParams } from "react-router-dom";
import { events } from "../data/events";
import NotFound from "./NotFound";
// Links da V1 continuam navegáveis, mas entram pela configuração atual da corrida.
export default function LegacyRequest() {
  const { slug } = useParams();
  return events.some((r) => r.slug === slug) ? (
    <Navigate replace to={`/corridas/${slug}`} />
  ) : (
    <NotFound />
  );
}
