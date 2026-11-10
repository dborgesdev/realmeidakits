import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCatalog } from "../state/CatalogContext";
import CatalogStatus from "../components/CatalogStatus";
import NotFound from "./NotFound";

export default function LegacyRequest() {
  const { events, status } = useCatalog();
  const { slug } = useParams();
  const race = events.find((entry) => entry.slug === slug);
  useEffect(() => {
    if (race) location.replace("/corridas/" + race.slug);
  }, [race]);
  if (status !== "ready") return <CatalogStatus />;
  return race ? (
    <a href={`/corridas/${race.slug}`}>Ver corrida</a>
  ) : (
    <NotFound />
  );
}
