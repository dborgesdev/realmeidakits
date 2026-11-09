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
  beginAccount,
  finishAccount,
  sessionHint,
  accountHost,
  type AccountProfile,
  type AccountSession,
  type SavedParticipant,
} from "../data/accountClient";
import type { Person } from "../types/domain";
type Account = {
  status: "loading" | "anonymous" | "authenticated" | "error";
  profile: AccountProfile | null;
  participants: SavedParticipant[];
  error: string;
  login: typeof beginAccount;
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
  const [status, setStatus] = useState<Account["status"]>(() => {
      try {
        return location.pathname === "/conta/retorno" ||
          sessionStorage.getItem(sessionHint) === "1"
          ? "loading"
          : "anonymous";
      } catch {
        return "anonymous";
      }
    }),
    [profile, setProfile] = useState<AccountProfile | null>(null),
    [participants, setParticipants] = useState<SavedParticipant[]>([]),
    [error, setError] = useState("");
  const token = useRef(""),
    expiry = useRef(0),
    started = useRef(false);
  const clear = useCallback(() => {
    token.current = "";
    setProfile(null);
    setParticipants([]);
    sessionStorage.removeItem(sessionHint);
    setStatus("anonymous");
  }, []);
  const request = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
      if (!token.current || expiry.current <= Date.now()) {
        clear();
        throw new AccountError("Sua sessão expirou. Entre novamente.", 401);
      }
      try {
        return await accountRequest<T>(path, token.current, method, body);
      } catch (e) {
        if (e instanceof AccountError && e.status === 401) clear();
        throw e;
      }
    },
    [clear],
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
    if (started.current) return;
    started.current = true;
    if (location.pathname === "/conta/retorno") {
      finishAccount()
        .then(
          async ({
            session,
            returnTo,
          }: {
            session: AccountSession;
            returnTo: string;
          }) => {
            token.current = session.accessToken;
            expiry.current = Date.now() + session.expiresIn * 1000;
            setProfile(session.data);
            const list = await accountRequest<{ data: SavedParticipant[] }>(
              "/account/participants",
              token.current,
            );
            setParticipants(list.data);
            setStatus("authenticated");
            history.replaceState(null, "", returnTo);
            dispatchEvent(new PopStateEvent("popstate"));
          },
        )
        .catch((e) => {
          clear();
          setError(e instanceof Error ? e.message : "Não foi possível entrar.");
          setStatus("error");
        });
    } else if (sessionStorage.getItem(sessionHint) === "1") {
      beginAccount("login", location.pathname).catch(() => {
        clear();
        setError("Não foi possível restabelecer a sessão.");
        setStatus("error");
      });
    }
  }, [clear]);
  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = window.setTimeout(
      () => {
        clear();
        setError("Sua sessão expirou. Entre novamente.");
      },
      Math.max(0, expiry.current - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [status, clear]);
  const logout = async () => {
    const result = await request<{ logoutUrl: string }>(
      "/auth/logout",
      "POST",
      {},
    );
    const url = new URL(result.logoutUrl);
    if (
      url.origin !== accountHost ||
      url.pathname !== "/wp-admin/admin-post.php" ||
      url.searchParams.get("action") !== "rak_end_session"
    )
      throw new Error("Retorno de saída inválido.");
    clear();
    location.assign(url.href);
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
        login: beginAccount,
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
