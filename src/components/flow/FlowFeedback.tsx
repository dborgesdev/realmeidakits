import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { FlowIssue } from "../../state/validationRules";
export type PanelNavigation = { participantId: string; sequence: number };
const Context = createContext<{
  issue: FlowIssue | null;
  validationParticipantId?: string;
  navigation: PanelNavigation | null;
  navigatePanel: (id: string) => void;
  clear: () => void;
}>({ issue: null, navigation: null, navigatePanel: () => {}, clear: () => {} });
export function focusControl(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({
    block: "start",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
export function FlowFeedback({
  issue,
  visibleIssue,
  navigation,
  navigatePanel,
  clear,
  children,
}: {
  visibleIssue: FlowIssue | null;
  issue: FlowIssue | null;
  navigation: PanelNavigation | null;
  navigatePanel: (id: string) => void;
  clear: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!issue) return;
    const frame = requestAnimationFrame(() => focusControl(issue.target));
    return () => cancelAnimationFrame(frame);
  }, [issue]);
  return (
    <Context.Provider
      value={{
        issue: visibleIssue,
        validationParticipantId: issue?.participantId,
        navigation,
        navigatePanel,
        clear,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useFlowFeedback() {
  const context = useContext(Context);
  return {
    ...context,
    field: (id: string, help?: string) => ({
      id,
      "aria-invalid": context.issue?.target === id || undefined,
      "aria-describedby":
        [help, context.issue?.target === id ? `${id}-error` : undefined]
          .filter(Boolean)
          .join(" ") || undefined,
    }),
  };
}
export function FieldError({ id }: { id: string }) {
  const { issue } = useContext(Context);
  return issue?.target === id ? (
    <p className="error field-error" id={`${id}-error`}>
      {issue.message}
    </p>
  ) : null;
}
