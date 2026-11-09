import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { catalogConfig } from "../config/catalog";
import { loadWordpressRaces } from "../data/wordpressClient";
import type { Race } from "../types/domain";
type Catalog = {
  events: Race[];
  source: "wordpress";
  status: "loading" | "ready" | "error";
  error?: string;
  retry: () => void;
};
const Context = createContext<Catalog | null>(null);
const configured = catalogConfig();
export function CatalogProvider({ children }: { children: ReactNode }) {
  const source = configured.source;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Omit<Catalog, "source" | "retry">>({
    events: [],
    status: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    loadWordpressRaces(configured.apiUrl, controller.signal)
      .then((events) => {
        if (!controller.signal.aborted) setResult({ events, status: "ready" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ events: [], status: "error", error: error.message });
      });
    return () => controller.abort();
  }, [attempt, source]);
  return (
    <Context.Provider
      value={{
        ...result,
        source,
        retry: () => {
          setResult({ events: [], status: "loading" });
          setAttempt((a) => a + 1);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCatalog() {
  const catalog = useContext(Context);
  if (!catalog) throw new Error("CatalogProvider ausente");
  return {
    ...catalog,
    findRace: (id: string) => catalog.events.find((r) => r.id === id),
  };
}
