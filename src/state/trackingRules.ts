import { voucherId } from "./participantRules.ts";
import type { DemoOrder } from "../types/domain";
export type TrackingScenario = "waiting" | "withdrawn";
export function trackingItems(
  order: DemoOrder,
  scenario: TrackingScenario = "waiting",
) {
  return order.participants
    .flatMap((participant) =>
      participant.items.map((item) => ({ participant, item })),
    )
    .map(({ participant, item }, index) => ({
      participant,
      item,
      bib: index === 0 ? "001 — EXEMPLO" : null,
      voucherId: voucherId(participant.id, item.raceId),
      payment: "Simulação concluída · sem confirmação bancária",
      documents: "Exemplos completos · não analisados",
      kit:
        index === 0
          ? "Disponível — cenário ilustrativo"
          : "Disponibilidade ainda não informada",
      withdrawal:
        index === 0 && scenario === "withdrawn"
          ? "Retirado — cenário ilustrativo"
          : "Aguardando retirada — cenário ilustrativo",
    }));
}
