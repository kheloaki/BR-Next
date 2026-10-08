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
  lines: Array<{
    bonDate: string;
    equipment: string;
    pumpMeter: string;
    fuelTime: string;
    litres: string;
  }>;
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
  const equipment = isAchat ? "—" : bon.equipmentName || bon.vehicleLabel || "—";
  const lines =
    !isAchat && bon.lineItems?.length
      ? bon.lineItems.map((l) => ({
          bonDate: formatDateFr(l.bonDate || bon.bonDate),
          equipment: l.vehicleLabel || equipment,
          pumpMeter: l.pumpMeter != null ? String(l.pumpMeter) : "—",
          fuelTime: formatTimeFr(l.fuelTime),
          litres: `${l.litres.toLocaleString("fr-MA")} L`,
        }))
      : [
          {
            bonDate: formatDateFr(bon.bonDate),
            equipment,
            pumpMeter: bon.pumpMeter != null ? String(bon.pumpMeter) : "—",
            fuelTime: isAchat ? "—" : formatTimeFr(bon.fuelTime),
            litres: `${bon.litres.toLocaleString("fr-MA")} L`,
          },
        ];
  const primary = lines[0];
  return {
    bonType: bon.bonType,
    number: bon.number,
    bonTypeLabel: GASOIL_BON_TYPE_LABELS[bon.bonType],
    vehicleCategoryLabel: isAchat ? "—" : GASOIL_VEHICLE_CATEGORY_LABELS[bon.vehicleCategory],
    chantier: projectName || bon.siteName || "—",
    bonDate: primary.bonDate,
    equipment: primary.equipment,
    pumpMeter: primary.pumpMeter,
    fuelTime: primary.fuelTime,
    litres: `${bon.litres.toLocaleString("fr-MA")} L`,
    driver: bon.beneficiary || "—",
    pompiste: bon.supplier || "—",
    supervisor: isAchat ? "—" : parseSupervisor(bon.notes),
    supplier: bon.supplier || "—",
    deliveryNote: bon.deliveryNote || "—",
    notes: bon.notes || "—",
    lines,
  };
}

export function gasoilBonExportFilename(number: string, ext: "pdf" | "xls", bonType?: GasoilBonType) {
  const safe = number.replace(/[^\dA-Za-z-]+/g, "_") || "bon";
  const prefix = bonType === "achat" ? "bon-de-commande-gasoil" : "bon-gasoil";
  return `${prefix}-${safe}.${ext}`;
}
