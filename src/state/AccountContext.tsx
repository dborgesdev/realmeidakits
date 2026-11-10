import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccountError,
  accountRequest,
  accountUrl,
  bootstrapAccount,
  clearContinuation,
  rememberedContinuation,
  rememberContinuation,
  type AccountProfile,
  type AccountSession,
  type SavedParticipant,
} from "../data/accountClient";
import { clearStoredDraft } from "./draftStorage";
import type { Person } from "../types/domain";
type Account = {
  status: "loading" | "anonymous" | "authenticated" | "error";
  profile: AccountProfile | null;
  participants: SavedParticipant[];
  error: string;
  editUrl: string | null;
  registrationEnabled: boolean;
  sessionVersion: number;
  participantLimit: number;
  recheck: () => Promise<void>;
  request: <T>(
    path: string,
    method?: string,
    body?: unknown,
    binary?: boolean,
  ) => Promise<T>;
  login: (
    intent: "login" | "register" | "recover",
    returnTo: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: Person) => Promise<void>;
  saveParticipant: (
    data: Person,
    id?: number,
    version?: number,
  ) => Promise<SavedParticipant>;
  removeParticipant: (id: number) => Promise<void>;
};
const Context = createContext<Account | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Account["status"]>("loading");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [participants, setParticipants] = useState<SavedParticipant[]>([]);
  const [error, setError] = useState("");
  const [session, setSession] = useState<AccountSession | null>(null);
  const nonce = useRef<string | null>(null);
  const started = useRef(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const clear = useCallback(() => {
    nonce.current = null;
    setSessionVersion((version) => version + 1);
    setProfile(null);
    setParticipants([]);
    setStatus("anonymous");
  }, []);
  const checking = useRef<Promise<void> | null>(null);
  const recheck = useCallback(() => {
    if (checking.current) return checking.current;
    setStatus("loading");
    setError("");
    const run = async () => {
      try {
        // WordPress issues a new nonce for the current cookie, never from storage.
        for (let attempt = 0; attempt < 2; attempt++) {
          const data = await bootstrapAccount();
          setSession(data);
          if (data.nonce === null) {
            clear();
            if (data.signedIn) {
              setError(
                "Esta sessão WordPress não é de uma conta de cliente. Abra Minha conta para trocar de usuário.",
              );
              setStatus("error");
            }
            return;
          }
          if (typeof data.nonce !== "string" || !data.nonce)
            throw new Error("Bootstrap inválido.");
          try {
            const [p, list] = await Promise.all([
              accountRequest<{ data: AccountProfile }>("/account", data.nonce),
              accountRequest<{ data: SavedParticipant[] }>(
                "/account/participants",
                data.nonce,
              ),
            ]);
            nonce.current = data.nonce;
            setProfile(p.data);
            setParticipants(list.data);
            if (rememberedContinuation() === location.pathname)
              clearContinuation();
            setStatus("authenticated");
            return;
          } catch (error) {
            if (
              attempt === 0 &&
              error instanceof AccountError &&
              (error.status === 401 ||
                error.code === "rest_cookie_invalid_nonce")
            )
              continue;
            throw error;
          }
        }
      } catch (error) {
        clear();
        setError(
          error instanceof AccountError && error.status >= 500
            ? error.message
            : "Não foi possível verificar sua sessão. Tente novamente.",
        );
        setStatus("error");
      }
    };
    checking.current = run().finally(() => {
      checking.current = null;
    });
    return checking.current;
  }, [clear]);
  const request = useCallback(
    async <T,>(
      path: string,
      method = "GET",
      body?: unknown,
      binary = false,
    ): Promise<T> => {
      const currentNonce = nonce.current;
      if (!currentNonce || checking.current)
        throw new AccountError("Verifique sua sessão antes de continuar.", 401);
      try {
        const result = await accountRequest<T>(
          path,
          currentNonce,
          method,
          body,
          binary,
        );
        if (nonce.current !== currentNonce)
          throw new AccountError("A sessão mudou.", 409);
        return result;
      } catch (error) {
        if (
          nonce.current === currentNonce &&
          error instanceof AccountError &&
          (error.status === 401 || error.code === "rest_cookie_invalid_nonce")
        ) {
          await recheck();
          throw new AccountError(
            "A sessão foi verificada. Se estiver conectado, tente a operação novamente.",
            409,
          );
        }
        throw error;
      }
    },
    [recheck],
  );
  const refresh = useCallback(async () => {
    const [p, list] = await Promise.all([
      request<{ data: AccountProfile }>("/account"),
      request<{ data: SavedParticipant[] }>("/account/participants"),
    ]);
    setProfile(p.data);
    setParticipants(list.data);
  }, [request]);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void recheck();
    }
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) void recheck();
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [recheck]);
  const login: Account["login"] = async (intent, returnTo) => {
    const links = session ?? (await bootstrapAccount());
    rememberContinuation(returnTo);
    const url = new URL(
      accountUrl(
        intent === "recover" ? links.recoveryUrl : links.accountUrl,
        returnTo,
      ),
    );
    if (intent === "register") {
      if (links.registrationEnabled === false)
        throw new Error("O cadastro está indisponível no WooCommerce.");
      url.hash = "rak_name";
    }
    location.assign(url);
  };
  const logout = async () => {
    await request("/account/session", "DELETE");
    clearStoredDraft();
    clearContinuation();
    clear();
    setError("");
  };
  const updateProfile = async (data: Person) => {
    const response = await request<{ data: AccountProfile }>(
      "/account",
      "PUT",
      data,
    );
    setProfile(response.data);
  };
  const saveParticipant = async (
    data: Person,
    id?: number,
    version?: number,
  ) => {
    const response = await request<{ data: SavedParticipant }>(
      "/account/participants" + (id ? "/" + id : ""),
      id ? "PUT" : "POST",
      { ...data, ...(id ? { version } : {}) },
    );
    setParticipants((items) =>
      [...items.filter((p) => p.id !== response.data.id), response.data].sort(
        (a, b) => a.id - b.id,
      ),
    );
    return response.data;
  };
  const removeParticipant = async (id: number) => {
    await request("/account/participants/" + id, "DELETE");
    setParticipants((items) => items.filter((p) => p.id !== id));
  };
  return (
    <Context.Provider
      value={{
        status,
        profile,
        participants,
        error,
        login,
        editUrl: session?.editUrl || null,
        sessionVersion,
        registrationEnabled: session?.registrationEnabled !== false,
        participantLimit: session?.participantLimit ?? 20,
        recheck,
        request,
        logout,
        refresh,
        updateProfile,
        saveParticipant,
        removeParticipant,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error("AccountProvider ausente");
  return value;
}
