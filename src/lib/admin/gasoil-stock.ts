import type { StockItem } from "@/components/admin/operations-types";

/** Dedicated category — gasoil stock is managed only under Carburant. */
export const GASOIL_STOCK_CATEGORY = "gasoil";

/** Unit for all gasoil quantities (stock, DA, traitements, bons). */
export const GASOIL_UNIT = "L";

export const GASOIL_STOCK_MODULE_MESSAGE = "Le stock gasoil se gère dans le module Carburant.";
export const GASOIL_STOCK_MODULE_HREF = "/admin/fuel/stock";

export function isGasoilStockModuleError(message: string) {
  return message.includes("module Carburant");
}

const GASOIL_PATTERN = /gasoil|gazoil|diesel|carburant/i;

export function isGasoilStockItem(item: {
  category?: string;
  reference?: string;
  designation?: string;
}): boolean {
  if (item.category === GASOIL_STOCK_CATEGORY) return true;
  if (item.category === "fuel") return true;
  const ref = item.reference ?? "";
  const des = item.designation ?? "";
  return GASOIL_PATTERN.test(ref) || GASOIL_PATTERN.test(des);
}

export function excludeGasoilFromStockList<T extends { category?: string; reference?: string; designation?: string }>(
  items: T[],
): T[] {
  return items.filter((i) => !isGasoilStockItem(i));
}

/** Finds the gasoil stock line (prefers category `gasoil`). */
export function findGasoilStockItem(items: StockItem[]): StockItem | null {
  const dedicated = items.find((i) => i.category === GASOIL_STOCK_CATEGORY);
  if (dedicated) return dedicated;
  const legacyFuel = items.find((i) => i.category === "fuel");
  if (legacyFuel) return legacyFuel;
  return (
    items.find(
      (i) => GASOIL_PATTERN.test(i.designation) || GASOIL_PATTERN.test(i.reference),
    ) ?? null
  );
}

export const DEFAULT_GASOIL_STOCK = {
  reference: "GASOIL",
  designation: "Gasoil",
  category: GASOIL_STOCK_CATEGORY,
} as const;
