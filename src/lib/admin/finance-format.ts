import type { FinanceMovement, FinancePaymentMethod } from "@/lib/admin/finance-types";

export function formatFinancePaymentReference(
  movement: Pick<FinanceMovement, "paymentMethod" | "chequeNumber" | "virementRef" | "effectRef" | "reference">,
): string {
  if (movement.paymentMethod === "cheque" && movement.chequeNumber) {
    return `Chèque n° ${movement.chequeNumber}`;
  }
  if (movement.paymentMethod === "transfer" && movement.virementRef) {
    return `Virement · ${movement.virementRef}`;
  }
  if (movement.paymentMethod === "effect" && movement.effectRef) {
    return `Effet · ${movement.effectRef}`;
  }
  if (movement.reference?.trim()) return movement.reference.trim();
  return "—";
}

export function formatFinancePaymentMethodLabel(method: FinancePaymentMethod | null | undefined): string {
  if (!method) return "—";
  const labels: Record<FinancePaymentMethod, string> = {
    cash: "Espèces",
    bank: "Banque",
    cheque: "Chèque",
    transfer: "Virement bancaire",
    effect: "Effet / traite",
  };
  return labels[method];
}
