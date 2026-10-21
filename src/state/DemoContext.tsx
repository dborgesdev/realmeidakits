import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { initialDraft } from "../data/demo";
import { findRace } from "../data/events";
import { changeSelection, toggleSelection } from "./selectionRules";
import type { Draft, Modality, Race, RaceSelection } from "../types/domain";
export type { Draft } from "../types/domain";
const Context = createContext<{
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  toggleRace: (race: Race, preferred?: Modality) => void;
  updateItem: (id: string, patch: Partial<RaceSelection>) => void;
  restart: () => void;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <Context.Provider
      value={{
        draft,
        setDraft,
        toggleRace: (race, preferred) =>
          setDraft((d) => toggleSelection(d, race, preferred)),
        updateItem: (id, patch) =>
          setDraft((d) => ({
            ...d,
            order: undefined,
            items: d.items.map((i) =>
              i.raceId === id && findRace(id)
                ? changeSelection(i, patch, findRace(id)!)
                : i,
            ),
          })),
        restart: () => setDraft(initialDraft()),
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
