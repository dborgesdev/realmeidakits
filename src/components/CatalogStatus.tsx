import { useCatalog } from "../state/CatalogContext";
export default function CatalogStatus() {
  const { status, error, retry } = useCatalog();
  return (
    <section
      className="container section"
      aria-live="polite"
      aria-busy={status === "loading"}
    >
      <h1>
        {status === "loading"
          ? "Carregando corridas…"
          : "Não foi possível carregar o catálogo"}
      </h1>
      {error && <p role="alert">{error}</p>}
      {status === "error" && (
        <button className="button" onClick={retry}>
          Tentar novamente
        </button>
      )}
    </section>
  );
}
