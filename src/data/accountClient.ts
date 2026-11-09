import { authReturn } from "../state/authRules";
import type { Person } from "../types/domain";
import { WORDPRESS_API_URL } from "../config/catalog";
export type AccountProfile = Person & { id: number };
export type SavedParticipant = { id: number; version: number; person: Person };
export type AccountSession = {
  accessToken: string;
  expiresIn: number;
  data: AccountProfile;
};
export class AccountError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AccountError";
  }
}
export async function accountRequest<T>(
  path: string,
  token?: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(WORDPRESS_API_URL + path, {
    method,
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new AccountError(
      "Resposta inválida do serviço de contas.",
      response.status,
    );
  }
  if (!response.ok)
    throw new AccountError(
      typeof data?.message === "string"
        ? data.message
        : "Não foi possível concluir a operação.",
      response.status,
    );
  return data as T;
}
export const accountHost = new URL(WORDPRESS_API_URL).origin;
const pendingKey = "rak_auth_pending";
export const sessionHint = "rak_session_active";
function random() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function beginAccount(
  intent: "login" | "register" | "recover" = "login",
  returnTo = "/conta",
) {
  const verifier = random(),
    state = random();
  const challenge = btoa(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(verifier),
        ),
      ),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const redirectUri = location.origin + "/conta/retorno";
  sessionStorage.setItem(
    pendingKey,
    JSON.stringify({
      verifier,
      state,
      redirectUri,
      created: Date.now(),
      returnTo: returnTo.startsWith("/solicitacao/") ? returnTo : "/conta",
    }),
  );
  const url = new URL("/wp-admin/admin-post.php", accountHost);
  url.search = new URLSearchParams({
    action: "rak_authorize",
    client: redirectUri,
    state,
    challenge,
    ...(intent !== "login" ? { intent } : {}),
  }).toString();
  location.assign(url.href);
}
let finishing: Promise<{ session: AccountSession; returnTo: string }> | null =
  null;
export function finishAccount(): Promise<{
  session: AccountSession;
  returnTo: string;
}> {
  // React StrictMode reuses a single exchange; the authorization code is one-use.
  if (finishing) return finishing;
  finishing = (async () => {
    const query = new URLSearchParams(location.search);
    history.replaceState(null, "", location.pathname);
    const raw = sessionStorage.getItem(pendingKey);
    sessionStorage.removeItem(pendingKey);
    const pending = raw ? JSON.parse(raw) : null;
    const validated = authReturn(query, pending, location.origin);
    const session = await accountRequest<AccountSession>(
      "/auth/token",
      undefined,
      "POST",
      {
        code: validated.code,
        verifier: validated.verifier,
        redirectUri: validated.redirectUri,
      },
    );
    sessionStorage.setItem(sessionHint, "1");
    return { session, returnTo: validated.returnTo };
  })();
  return finishing;
}
