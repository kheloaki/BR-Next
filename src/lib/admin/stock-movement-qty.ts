import type { StockMovementType } from "@/components/admin/operations-types";

export function stockMovementQtyDelta(type: StockMovementType, qty: number) {
  const n = Math.abs(qty);
  if (type === "entry" || type === "return") return n;
  return -n;
}
