import type { StockItem } from "@/components/admin/operations-types";
import type { StockMovementType } from "@/components/admin/operations-types";

export type GasoilUnitPriceInfo = {
  unitPricePerLitre: number;
  source: "stock" | "movements" | "none";
  label: string;
};

type GasoilPriceMovement = {
  movementType: StockMovementType;
  qty: number;
  unitPrice: number;
};

export function resolveGasoilUnitPrice(
  stock: StockItem | null,
  movements: GasoilPriceMovement[],
): GasoilUnitPriceInfo {
  if (stock && stock.unitPrice > 0) {
    return {
      unitPricePerLitre: stock.unitPrice,
      source: "stock",
      label: "prix enregistré sur le stock gasoil",
    };
  }

  const entries = movements.filter(
    (m) =>
      (m.movementType === "entry" || m.movementType === "return") &&
      m.unitPrice > 0 &&
      m.qty > 0,
  );

  if (entries.length === 0) {
    return {
      unitPricePerLitre: 0,
      source: "none",
      label: "",
    };
  }

  let totalQty = 0;
  let totalValue = 0;
  for (const m of entries) {
    totalQty += m.qty;
    totalValue += m.qty * m.unitPrice;
  }

  if (totalQty > 0) {
    return {
      unitPricePerLitre: totalValue / totalQty,
      source: "movements",
      label: "moyenne des entrées stock gasoil",
    };
  }

  return {
    unitPricePerLitre: entries[0]!.unitPrice,
    source: "movements",
    label: "dernière entrée stock gasoil",
  };
}
