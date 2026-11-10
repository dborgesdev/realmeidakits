import { WORDPRESS_API_URL, WORDPRESS_ROOT } from "../config/catalog";
import type { Person } from "../types/domain";

export type AccountProfile = Person & { id: number };
export type SavedParticipant = { id: number; version: number; person: Person };
export type AccountSession = {
  nonce: string | null;
  participantLimit?: number;
  signedIn?: boolean;
  registrationEnabled?: boolean;
  accountUrl: string;
  recoveryUrl: string;
  editUrl: string;
  checkoutUrl: string;
};

export class AccountError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AccountError";
  }
}

async function readResponse<T>(
  url: string,
  init: RequestInit,
  binary = false,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (binary && response.ok) return (await response.blob()) as T;
  const data = await response.json().catch(() => null);
  if (!data || typeof data !== "object")
    throw new AccountError(
      "Resposta inválida do serviço de contas.",
      response.status,
    );
  if (!response.ok)
    throw new AccountError(
      data.message || "Não foi possível concluir a operação.",
      response.status,
      data.code,
    );
  return data as T;
}

export function bootstrapAccount() {
  return readResponse<AccountSession>(
    WORDPRESS_ROOT + "/wp-admin/admin-ajax.php?action=rak_session",
    {
      headers: { "X-RAK-Session": "1" },
    },
  );
}

export function accountRequest<T>(
  path: string,
  nonce: string,
  method = "GET",
  body?: unknown,
  binary = false,
) {
  const multipart = body instanceof FormData;
  return readResponse<T>(
    WORDPRESS_API_URL + path,
    {
      method,
      headers: {
        Accept: binary
          ? "application/octet-stream, application/json"
          : "application/json",
        "X-WP-Nonce": nonce,
        ...(body && !multipart ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
    },
    binary,
  );
}

export function continuation(path: string | null) {
  return path &&
    path.trim() === path &&
    /^\/(?:conta|solicitacao\/(?:pedido|responsavel|participantes|documentos|condicoes|revisao|pagamento|configuracao|identificacao|dados|confirmacao)|corridas(?:\/[a-z0-9-]+)?)$/.test(
      path,
    )
    ? path
    : null;
}

const returnKey = "rak_account_return";
export function rememberContinuation(path: string) {
  try {
    if (continuation(path))
      sessionStorage.setItem(
        returnKey,
        JSON.stringify({ path, until: Date.now() + 30 * 60_000 }),
      );
  } catch {
    // Navigation still works when browser storage is unavailable.
  }
}
export function rememberedContinuation() {
  try {
    const value = JSON.parse(sessionStorage.getItem(returnKey) ?? "null");
    return typeof value?.path === "string" &&
      typeof value.until === "number" &&
      value.until > Date.now()
      ? continuation(value.path)
      : null;
  } catch {
    return null;
  }
}
export function clearContinuation() {
  try {
    sessionStorage.removeItem(returnKey);
  } catch {
    // Storage may be disabled.
  }
}

export function accountUrl(url: string, returnTo: string) {
  const target = new URL(url, location.origin);
  if (
    target.origin !== location.origin ||
    !target.pathname.startsWith(WORDPRESS_ROOT + "/")
  )
    throw new Error("Página de conta indisponível nesta origem.");
  if (continuation(returnTo)) target.searchParams.set("rak_return", returnTo);
  return target.href;
}
