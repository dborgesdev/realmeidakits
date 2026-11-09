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
const Context = createContext<{
  draft: Draft;
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
  restart: () => void;
  prefer: (modality: Modality) => void;
} | null>(null);
export function RequestProvider({ children }: { children: ReactNode }) {
  const { profile } = useAccount();
  const previousUser = useRef<number | null>(null);
  const { findRace } = useCatalog();
  const [draft, storeDraft] = useState(() => {
    const draft = initialDraft();
    try {
      const value = JSON.parse(
        sessionStorage.getItem("rak_race_selection") || "null",
      );
      if (
        value &&
        Array.isArray(value.ids) &&
        value.ids.every((id: unknown) => typeof id === "string")
      )
        draft.selectedRaceIds = value.ids.slice(0, 100);
    } catch {
      /* Selection is optional navigation context, never personal data. */
    }
    return draft;
  });
  useEffect(() => {
    sessionStorage.setItem(
      "rak_race_selection",
      JSON.stringify({ ids: draft.selectedRaceIds }),
    );
  }, [draft.selectedRaceIds]);
  useEffect(() => {
    if (profile) {
      const changed =
        previousUser.current !== null && previousUser.current !== profile.id;
      previousUser.current = profile.id;
      storeDraft((d) => ({
        ...(changed ? initialDraft() : d),
        responsible: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          identifier: profile.cpf,
        },
      }));
    } else if (previousUser.current !== null) {
      previousUser.current = null;
      storeDraft(initialDraft());
    }
  }, [profile]);
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
        draft,
        prefer,
        setDraft,
        toggleRace: (race) => storeDraft((d) => selectForNewOrder(d, race)),
        assign: (id, race) => setDraft((d) => assignRace(d, id, race)),
        resize: (count) => setDraft((d) => resizeParticipants(d, count)),
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
        restart: () => storeDraft(initialDraft()),
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
