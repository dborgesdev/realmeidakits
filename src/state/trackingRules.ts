import type { DemoOrder } from "../types/domain";
export type TrackingScenario = "waiting" | "withdrawn";
export function trackingItems(
  order: DemoOrder,
  scenario: TrackingScenario = "waiting",
) {
  return order.items.map((item, index) => ({
    item,
    bib: index === 0 ? "001 — EXEMPLO" : null,
    voucherId: `DEMO-VOUCHER-${item.raceId}`,
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
