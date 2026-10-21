import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { initialDraft } from "../data/demo";
import { events, findRace } from "../data/events";
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
import { editableUpdate, finalizeOrder } from "./orderRules";
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
  complete: () => void;
  restart: () => void;
  prefer: (modality: Modality) => void;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [draft, storeDraft] = useState(initialDraft);
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
        complete: () => storeDraft((d) => finalizeOrder(d, events)),
        restart: () => storeDraft(initialDraft()),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("DemoProvider ausente");
  return value;
}
