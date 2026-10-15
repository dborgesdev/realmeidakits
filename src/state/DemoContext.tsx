import { createContext, useContext, useState, type ReactNode } from "react";
import { initial, type Draft } from "../data/demo";
export type { Draft } from "../data/demo";
const Context = createContext<{
  draft: Draft;
  setDraft: (value: Draft) => void;
  reset: (slug: string, modality?: Draft["modality"]) => void;
} | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  return (
    <Context.Provider
      value={{
        draft,
        setDraft,
        reset: (slug, modality = "oficial") =>
          setDraft({ ...initial, slug, modality }),
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
