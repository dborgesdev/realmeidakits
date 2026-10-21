import type { DemoOrder, Draft, Race } from "../types/domain";
import { pendingStage } from "./requestRules.ts";
function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeDeep(child);
  }
  return value;
}
export function finalizeOrder(draft: Draft, catalog: Race[]): Draft {
  if (draft.order || pendingStage(draft, catalog) !== "revisao") return draft;
  const order: DemoOrder = {
    id: "DEMO-PEDIDO-001",
    responsible: structuredClone(draft.responsible),
    participants: structuredClone(draft.participants),
    method: draft.method,
  };
  return { ...draft, order: freezeDeep(order) };
}
export function editableUpdate(
  draft: Draft,
  update: (current: Draft) => Draft,
): Draft {
  return draft.order ? draft : update(draft);
}
