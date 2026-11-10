import type { Race } from "../types/domain";
import { normalizePage, normalizeRace } from "./normalizeRace.ts";
export class CatalogError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = "CatalogError";
  }
}
async function request(url: string, signal?: AbortSignal) {
  try {
    const response = await fetch(url, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
        : AbortSignal.timeout(12000),
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new CatalogError(
        response.status === 404
          ? "Corrida não encontrada."
          : "A API de corridas está indisponível. Tente novamente.",
        response.status,
      );
    return (await response.json()) as unknown;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof CatalogError) throw error;
    throw new CatalogError(
      "Não foi possível carregar as corridas. Verifique a conexão ou tente novamente.",
    );
  }
}
export async function loadWordpressRaces(
  apiUrl: string,
  signal?: AbortSignal,
): Promise<Race[]> {
  const resolvedApiUrl = new URL(apiUrl, globalThis.location?.origin).href;
  const races: Race[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const result = normalizePage(
      await request(
        `${resolvedApiUrl}/corridas?per_page=100&page=${page}`,
        signal,
      ),
      resolvedApiUrl,
    );
    if (
      result.page !== page ||
      result.totalPages > 1000 ||
      (page > 1 && result.totalPages !== pages)
    )
      throw new CatalogError(
        "O catálogo mudou durante a consulta. Recarregue as corridas.",
      );
    pages = result.totalPages;
    races.push(...result.races);
    if (page === pages && races.length !== result.total)
      throw new CatalogError("O catálogo está incompleto. Tente novamente.");
  }
  if (
    new Set(races.map((r) => r.id)).size !== races.length ||
    new Set(races.map((r) => r.slug)).size !== races.length
  )
    throw new CatalogError("A API retornou corridas duplicadas.");
  return races;
}
export async function loadWordpressRace(
  apiUrl: string,
  slug: string,
  signal?: AbortSignal,
) {
  if (!/^[a-z0-9-]{1,200}$/.test(slug))
    throw new CatalogError("Identificador de corrida inválido.");
  const resolvedApiUrl = new URL(apiUrl, globalThis.location?.origin).href;
  const result = await request(
    `${resolvedApiUrl}/corridas/${encodeURIComponent(slug)}`,
    signal,
  );
  if (!result || typeof result !== "object" || !("data" in result))
    throw new CatalogError("Resposta inválida da API.");
  return normalizeRace(result.data, resolvedApiUrl);
}
