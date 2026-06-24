import type {
  GasoilBonType,
  GasoilVehicleCategory,
  MaterialCategory,
} from "@/components/admin/operations-types";
import { roundMoney } from "@/lib/admin/price-ht-ttc";

export const GASOIL_BON_TYPES: GasoilBonType[] = ["achat", "sortie"];

export const GASOIL_VEHICLE_CATEGORIES: GasoilVehicleCategory[] = [
  "engin",
  "camion",
  "voiture",
  "groupe_electrogene",
];

export const GASOIL_BON_TYPE_LABELS: Record<GasoilBonType, string> = {
  achat: "Bon de commande",
  sortie: "Bon de sortie",
};

export const GASOIL_VEHICLE_CATEGORY_LABELS: Record<GasoilVehicleCategory, string> = {
  engin: "Engin",
  camion: "Camion",
  voiture: "Voiture",
  groupe_electrogene: "Groupe électrogène",
};

/** Responsable par défaut sur les bons de sortie gasoil. */
export const DEFAULT_GASOIL_SUPERVISOR = "JAMAL BARANE";

export function gasoilCategoryToMaterialCategory(category: GasoilVehicleCategory): MaterialCategory {
  if (category === "groupe_electrogene") return "groupe_electrogen";
  return category;
}

export function materialCategoryToGasoilCategory(category: MaterialCategory): GasoilVehicleCategory {
  if (category === "groupe_electrogen") return "groupe_electrogene";
  if (category === "engin" || category === "camion" || category === "voiture") return category;
  return "engin";
}

/** Persisted on admin_gasoil_bons — each bon carries its own purchase / applied price. */
export function gasoilBonPriceFields(litres: number, unitPricePerLitre: number) {
  const unitPrice = Math.max(0, Number(unitPricePerLitre) || 0);
  const qty = Math.max(0, Number(litres) || 0);
  return {
    unit_price: unitPrice,
    total_amount: roundMoney(qty * unitPrice),
  };
}

export function fuelEntryCostMad(entry: { litres: number; unitPrice?: number; totalAmount?: number }) {
  if (entry.totalAmount != null && entry.totalAmount > 0) return entry.totalAmount;
  const price = Math.max(0, Number(entry.unitPrice) || 0);
  if (price <= 0) return 0;
  return roundMoney(entry.litres * price);
}
