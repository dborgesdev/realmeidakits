import { useEffect, useState } from "react";
import type { Draft, Race } from "../types/domain";
import { useAccount } from "./AccountContext";
import { AccountError } from "../data/accountClient";
import { raceOptions } from "./catalogRules";

type Payload = Omit<Draft, "responsible" | "order"> & { stage: string };
type Remote = { version: number; draft: Payload | null; submitted?: boolean };
type Loaded = {
  owner: number;
  sessionVersion: number;
  version: number;
  saved: string | null;
  submitted?: boolean;
};

function payload(
  draft: Omit<Draft, "responsible" | "order">,
  stage: string,
): Payload {
  return {
    selectedRaceIds: draft.selectedRaceIds,
    participants: draft.participants,
    acceptedConditions: draft.acceptedConditions,
    preferredModality: draft.preferredModality,
    prepared: draft.prepared,
    nextParticipantNumber: draft.nextParticipantNumber,
    stage,
  };
}

function reconcile(draft: Payload, races: Race[], known: Set<number>): Payload {
  const catalog = new Map(races.map((race) => [race.id, race]));
  return {
    ...draft,
    selectedRaceIds: draft.selectedRaceIds.filter((id) => catalog.has(id)),
    participants: draft.participants.map((person) => ({
      ...person,
      directoryId: known.has(person.directoryId ?? 0)
        ? person.directoryId
        : undefined,
      directoryVersion: known.has(person.directoryId ?? 0)
        ? person.directoryVersion
        : undefined,
      items: person.items.flatMap((item) => {
        const race = catalog.get(item.raceId);
        const mode = race?.modalities.find(
          (entry) => entry.id === item.modality,
        );
        if (!race || !mode) return [];
        const options = raceOptions(race, mode.id);
        return [
          {
            ...item,
            distance: options.distances.includes(item.distance)
              ? item.distance
              : "",
            kitType: options.kitTypes.includes(item.kitType)
              ? item.kitType
              : "",
            pickup: options.pickupLocations.includes(item.pickup)
              ? item.pickup
              : "",
            size: mode.sizes?.includes(item.size) ? item.size : "",
          },
        ];
      }),
    })),
  };
}

export function useRemoteDraft(
  draft: Draft,
  stage: string,
  races: Race[],
  catalogReady: boolean,
  restore: (draft: Payload, owner: number) => void,
  applyDocuments: (draft: Payload, owner: number) => void,
) {
  const { status, profile, request, participants, sessionVersion } =
    useAccount();
  const owner = profile?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{
    owner: number;
    sessionVersion: number;
    message: string;
  } | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(0);
  const [inFlight, setInFlight] = useState(false);
  const current =
    loaded?.owner === owner && loaded.sessionVersion === sessionVersion
      ? loaded
      : null;
  const error =
    failure?.owner === owner && failure.sessionVersion === sessionVersion
      ? failure.message
      : "";
  const serialized = JSON.stringify(payload(draft, stage));
  const dirty =
    !!current &&
    !current.submitted &&
    (current.saved === null
      ? draft.selectedRaceIds.length > 0
      : current.saved !== serialized);

  useEffect(() => {
    if (
      owner === null ||
      status !== "authenticated" ||
      !catalogReady ||
      current ||
      error
    )
      return;
    let active = true;
    request<Remote>("/account/draft")
      .then(async (remote) => {
        if (!active) return;
        if (remote.submitted) {
          try {
            remote = await request<Remote>("/account/draft/reset", "POST", {
              version: remote.version,
            });
          } catch (cause) {
            if (!(cause instanceof AccountError) || cause.status !== 409)
              throw cause;
            remote = await request<Remote>("/account/draft");
            if (remote.submitted) throw cause;
          }
          if (!active) return;
        }
        if (remote.draft) {
          const next = reconcile(
            remote.draft,
            races,
            new Set(participants.map((person) => person.id)),
          );
          restore(next, owner);
          setLoaded({
            owner,
            sessionVersion,
            version: remote.version,
            submitted: remote.submitted,
            saved: JSON.stringify(payload(remote.draft, remote.draft.stage)),
          });
        } else {
          setLoaded({
            owner,
            sessionVersion,
            version: remote.version,
            saved: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setFailure({
            owner,
            sessionVersion,
            message:
              cause instanceof Error
                ? cause.message
                : "Não foi possível carregar o rascunho.",
          });
      });
    return () => {
      active = false;
    };
  }, [
    owner,
    status,
    current,
    error,
    catalogReady,
    request,
    races,
    participants,
    restore,
    loadingAttempt,
    sessionVersion,
  ]);

  useEffect(() => {
    if (!current || status !== "authenticated" || !dirty || error || inFlight)
      return;
    const timer = window.setTimeout(() => {
      setInFlight(true);
      request<Remote>("/account/draft", "PUT", {
        version: current.version,
        draft: JSON.parse(serialized),
      })
        .then(({ version }) =>
          setLoaded((previous) =>
            previous === current
              ? { ...current, version, saved: serialized }
              : previous,
          ),
        )
        .catch((cause: unknown) =>
          setFailure({
            owner: current.owner,
            sessionVersion: current.sessionVersion,
            message:
              cause instanceof Error
                ? cause.message
                : "Não foi possível salvar.",
          }),
        )
        .finally(() => setInFlight(false));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [current, status, dirty, error, inFlight, request, serialized]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function changeDocument(
    method: "POST" | "DELETE",
    file: FormData | string,
  ) {
    if (!current || dirty || error || inFlight)
      throw new Error("Aguarde o salvamento do rascunho.");
    const path =
      "/account/draft/documents" + (typeof file === "string" ? "/" + file : "");
    if (file instanceof FormData) file.set("version", String(current.version));
    setInFlight(true);
    try {
      const result = await request<Remote>(
        path,
        method,
        typeof file === "string" ? { version: current.version } : file,
      );
      if (!result.draft)
        throw new Error("Resposta inválida do serviço de documentos.");
      applyDocuments(result.draft, current.owner);
      setLoaded((previous) =>
        previous === current
          ? {
              ...current,
              version: result.version,
              saved: JSON.stringify(
                payload(result.draft!, result.draft!.stage),
              ),
            }
          : previous,
      );
    } finally {
      setInFlight(false);
    }
  }

  async function reset() {
    if (!current || inFlight)
      throw new Error("Aguarde a operação em andamento.");
    setInFlight(true);
    try {
      const result = await request<Remote>("/account/draft/reset", "POST", {
        version: current.version,
      });
      setLoaded({
        owner: current.owner,
        sessionVersion: current.sessionVersion,
        version: result.version,
        saved: null,
      });
      setFailure(null);
    } finally {
      setInFlight(false);
    }
  }

  return {
    reset,
    version: current?.version ?? 0,
    submitted: current?.submitted === true,
    changeDocument,
    documentBusy: inFlight,
    loaded: !!current,
    dirty,
    status: error
      ? "error"
      : owner === null
        ? "guest"
        : !current
          ? "loading"
          : dirty
            ? "saving"
            : current.saved
              ? "saved"
              : "empty",
    error,
    retry: () => {
      setFailure(null);
      setLoadingAttempt((attempt) => attempt + 1);
    },
  };
}
