import type { GasoilBon, GasoilBonType } from "@/components/admin/operations-types";
import {
  GASOIL_BON_TYPE_LABELS,
  GASOIL_VEHICLE_CATEGORY_LABELS,
} from "@/lib/admin/gasoil-bon";
import { formatDateFr } from "@/lib/admin/date-time-fr";

export type GasoilBonExportData = {
  bonType: GasoilBonType;
  number: string;
  bonTypeLabel: string;
  vehicleCategoryLabel: string;
  chantier: string;
  bonDate: string;
  equipment: string;
  pumpMeter: string;
  fuelTime: string;
  litres: string;
  driver: string;
  pompiste: string;
  supervisor: string;
  supplier: string;
  deliveryNote: string;
  notes: string;
};

function parseSupervisor(notes: string): string {
  const m = notes.match(/Responsable:\s*([^|]+)/i);
  return m?.[1]?.trim() ?? "";
}
function formatTimeFr(value: string) {
  if (!value) return "—";
  const [h, m] = value.split(":");
  if (h == null || m == null) return value;
  return `${h}h${m}`;
}

export function buildGasoilBonExportData(
  bon: GasoilBon,
  projectName: string,
): GasoilBonExportData {
  const isAchat = bon.bonType === "achat";
  return {
    bonType: bon.bonType,
    number: bon.number,
    bonTypeLabel: GASOIL_BON_TYPE_LABELS[bon.bonType],
    vehicleCategoryLabel: isAchat ? "—" : GASOIL_VEHICLE_CATEGORY_LABELS[bon.vehicleCategory],
    chantier: projectName || bon.siteName || "—",
    bonDate: formatDateFr(bon.bonDate),
    equipment: isAchat ? "—" : bon.equipmentName || bon.vehicleLabel || "—",
    pumpMeter: bon.pumpMeter != null ? String(bon.pumpMeter) : "—",
    fuelTime: isAchat ? "—" : formatTimeFr(bon.fuelTime),
    litres: `${bon.litres.toLocaleString("fr-MA")} L`,
    driver: bon.beneficiary || "—",
    pompiste: bon.supplier || "—",
    supervisor: isAchat ? "—" : parseSupervisor(bon.notes),
    supplier: bon.supplier || "—",
    deliveryNote: bon.deliveryNote || "—",
    notes: bon.notes || "—",
  };
}

export function gasoilBonExportFilename(number: string, ext: "pdf" | "xls", bonType?: GasoilBonType) {
  const safe = number.replace(/[^\dA-Za-z-]+/g, "_") || "bon";
  const prefix = bonType === "achat" ? "bon-de-commande-gasoil" : "bon-gasoil";
  return `${prefix}-${safe}.${ext}`;
}
