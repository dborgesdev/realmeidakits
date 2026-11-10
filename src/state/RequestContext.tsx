import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useAccount } from "./AccountContext";
import { initialDraft } from "./draft";
import { useRemoteDraft } from "./useRemoteDraft";
import { clearStoredDraft, readDraft, writeDraft } from "./draftStorage";
import { useCatalog } from "../state/CatalogContext";
import {
  changeSelection,
  selectForNewOrder,
  preferModality,
} from "./selectionRules";
import {
  assignRace,
  resizeParticipants,
  removeParticipant,
} from "./participantRules";
import { editableUpdate } from "./orderRules";
import type { Draft, Race, RaceSelection, Modality } from "../types/domain";
export type { Draft } from "../types/domain";
const draftOwnerKey = Symbol("draftOwner");
const Context = createContext<{
  draft: Draft;
  stage: string;
  setStage: (stage: string) => void;
  persistence: ReturnType<typeof useRemoteDraft>;
  setDraft: Dispatch<SetStateAction<Draft>>;
  toggleRace: (race: Race) => void;
  updateItem: (
    personId: string,
    raceId: string,
    patch: Partial<RaceSelection>,
  ) => void;
  assign: (id: string, race: Race) => void;
  resize: (count: number) => void;
  remove: (id: string) => void;
  restart: () => Promise<void>;
  prefer: (modality: Modality) => void;
} | null>(null);
export function RequestProvider({ children }: { children: ReactNode }) {
  const { profile, status, participantLimit } = useAccount();
  const previousUser = useRef<number | null>(null);
  const { findRace, events, status: catalogStatus } = useCatalog();
  const [stage, setStage] = useState("pedido");
  const [draft, storeDraft] = useState<Draft & { [draftOwnerKey]?: number }>(
    () => readDraft(null),
  );
  const owner = profile?.id ?? null;
  useEffect(() => {
    if (
      owner === null &&
      previousUser.current === null &&
      (draft.selectedRaceIds.length || readDraft(null).selectedRaceIds.length)
    )
      writeDraft(draft, owner);
  }, [draft, owner]);
  useEffect(() => {
    if (profile) {
      const changed =
        previousUser.current !== null && previousUser.current !== profile.id;
      previousUser.current = profile.id;
      storeDraft((d) => ({
        ...(changed ? initialDraft() : d),
        [draftOwnerKey]: profile.id,
        responsible: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          identifier: profile.cpf,
        },
      }));
    } else if (status !== "loading" && previousUser.current !== null) {
      previousUser.current = null;
      storeDraft(readDraft(null));
    }
  }, [profile, status]);
  const restore = useCallback(
    (
      value: Omit<Draft, "responsible" | "order"> & { stage: string },
      userId: number,
    ) => {
      const { stage: savedStage, ...fields } = value;
      setStage(savedStage);
      storeDraft((current) => ({
        ...fields,
        [draftOwnerKey]: userId,
        responsible: current.responsible,
      }));
    },
    [],
  );
  const applyDocuments = useCallback(
    (value: Omit<Draft, "responsible" | "order">, userId: number) => {
      storeDraft((current) =>
        current[draftOwnerKey] === userId
          ? {
              ...current,
              participants: current.participants.map((person) => {
                const saved = value.participants.find(
                  (entry) =>
                    entry.id === person.id &&
                    entry.directoryId === person.directoryId,
                );
                return saved
                  ? {
                      ...person,
                      items: person.items.map((item) => {
                        const previous = saved.items.find(
                          (entry) =>
                            entry.raceId === item.raceId &&
                            entry.modality === item.modality,
                        );
                        return previous
                          ? { ...item, documents: previous.documents }
                          : item;
                      }),
                    }
                  : person;
              }),
            }
          : current,
      );
    },
    [],
  );
  const persistence = useRemoteDraft(
    draft,
    stage,
    events,
    catalogStatus === "ready",
    restore,
    applyDocuments,
  );
  const prefer = useCallback((modality: Modality) => {
    storeDraft((d) => preferModality(d, modality));
  }, []);
  const setDraft: Dispatch<SetStateAction<Draft>> = (update) =>
    storeDraft((d) =>
      editableUpdate(d, (current) =>
        typeof update === "function" ? update(current) : update,
      ),
    );
  return (
    <Context.Provider
      value={{
        // Hide the previous form before the account-change effect runs.
        draft:
          draft[draftOwnerKey] !== undefined && draft[draftOwnerKey] !== owner
            ? initialDraft()
            : draft,
        stage,
        setStage,
        persistence,
        prefer,
        setDraft,
        toggleRace: (race) => storeDraft((d) => selectForNewOrder(d, race)),
        assign: (id, race) => setDraft((d) => assignRace(d, id, race)),
        resize: (count) =>
          setDraft((d) => resizeParticipants(d, count, participantLimit)),
        remove: (id) => setDraft((d) => removeParticipant(d, id)),
        updateItem: (personId, raceId, patch) =>
          setDraft((d) => ({
            ...d,
            participants: d.participants.map((p) =>
              p.id === personId
                ? {
                    ...p,
                    items: p.items.map((i) =>
                      i.raceId === raceId && findRace(raceId)
                        ? changeSelection(i, patch, findRace(raceId)!)
                        : i,
                    ),
                  }
                : p,
            ),
          })),
        restart: async () => {
          await persistence.reset();
          clearStoredDraft();
          setStage("pedido");
          storeDraft((current) => ({
            ...initialDraft(),
            [draftOwnerKey]: current[draftOwnerKey],
            responsible: current.responsible,
          }));
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useRequest() {
  const value = useContext(Context);
  if (!value) throw new Error("RequestProvider ausente");
  return value;
}
