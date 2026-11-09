import { Navigate, useParams } from "react-router-dom";
import { useCatalog } from "../state/CatalogContext";
import NotFound from "./NotFound";
// Links da V1 continuam navegáveis, mas entram pela configuração atual da corrida.
export default function LegacyRequest() {
  const { events } = useCatalog();
  const { slug } = useParams();
  return events.some((r) => r.slug === slug) ? (
    <Navigate replace to={`/corridas/${slug}`} />
  ) : (
    <NotFound />
  );
}
