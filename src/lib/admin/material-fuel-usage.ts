import type {
  FuelEntry,
  MaterialCategory,
  RentalContract,
  RentalMaterial,
} from "@/components/admin/operations-types";
import { fuelEntryCostMad } from "@/lib/admin/gasoil-bon";
import { computeBonLineUsageHours, computeBonLineRental } from "@/lib/admin/map-rental-material";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";

export type MaterialUsageRow = {
  key: string;
  materialId: string | null;
  label: string;
  totalHours: number;
  totalLitres: number;
  totalRentalMad: number;
  totalCostMad: number;
  unpricedLitres: number;
};

export type MaterialUsageCostRow = MaterialUsageRow & {
  litresPerHour: number | null;
  costPerHourMad: number | null;
  rentalMadPerHour: number | null;
  totalOperatingMad: number;
  operatingMadPerHour: number | null;
};

export type MaterialUsageSummary = {
  rows: MaterialUsageCostRow[];
  totalUnpricedLitres: number;
};

export function enrichMaterialUsageWithCost(rows: MaterialUsageRow[]): MaterialUsageCostRow[] {
  return rows.map((row) => {
    const litresPerHour = row.totalHours > 0 ? row.totalLitres / row.totalHours : null;
    const totalCostMad = row.totalCostMad;
    const costPerHourMad = row.totalHours > 0 && totalCostMad > 0 ? totalCostMad / row.totalHours : null;
    const rentalMadPerHour =
      row.totalHours > 0 && row.totalRentalMad > 0 ? row.totalRentalMad / row.totalHours : null;
    const totalOperatingMad = row.totalRentalMad + totalCostMad;
    const operatingMadPerHour =
      row.totalHours > 0 && totalOperatingMad > 0 ? totalOperatingMad / row.totalHours : null;
    return {
      ...row,
      litresPerHour,
      totalCostMad,
      costPerHourMad,
      rentalMadPerHour,
      totalOperatingMad,
      operatingMadPerHour,
    };
  });
}

export type MaterialUsageFilters = {
  projectId?: string;
  materialName?: string;
  category?: string;
  driver?: string;
  dateFrom?: string;
  dateTo?: string;
};

function materialKey(id: string | null, label: string): string {
  const trimmed = id?.trim();
  if (trimmed) return trimmed;
  return `name:${label.trim().toLowerCase()}`;
}

function resolveMaterialLabel(
  materialId: string,
  materials: RentalMaterial[],
  fallback: string,
): string {
  if (!materialId) return fallback.trim() || "—";
  const m = materials.find((x) => x.id === materialId);
  return m ? materialLabel(m) : fallback.trim() || "—";
}

function lineMatchesDateRange(lineDate: string, dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom && !dateTo) return true;
  const d = lineDate.slice(0, 10);
  if (!d) return false;
  if (dateFrom && d < dateFrom) return false;
  if (dateTo && d > dateTo) return false;
  return true;
}

function materialCategoryMatchesFilter(
  materialCategory: MaterialCategory | undefined,
  filterCategory: string,
): boolean {
  if (!filterCategory) return true;
  if (!materialCategory) return false;
  if (filterCategory === "groupe_electrogene") return materialCategory === "groupe_electrogen";
  return materialCategory === filterCategory;
}

export function buildMaterialUsageSummary(
  fuelEntries: FuelEntry[],
  rentals: RentalContract[],
  materials: RentalMaterial[],
  filters: MaterialUsageFilters = {},
): MaterialUsageSummary {
  const map = new Map<string, MaterialUsageRow>();

  function upsert(
    key: string,
    materialId: string | null,
    label: string,
    hours = 0,
    litres = 0,
    rentalMad = 0,
    costMad = 0,
    unpricedLitres = 0,
  ) {
    const row = map.get(key) ?? {
      key,
      materialId,
      label,
      totalHours: 0,
      totalLitres: 0,
      totalRentalMad: 0,
      totalCostMad: 0,
      unpricedLitres: 0,
    };
    row.totalHours += hours;
    row.totalLitres += litres;
    row.totalRentalMad += rentalMad;
    row.totalCostMad += costMad;
    row.unpricedLitres += unpricedLitres;
    if (row.label === "—" && label !== "—") row.label = label;
    map.set(key, row);
  }

  for (const contract of rentals) {
    if (filters.projectId && contract.projectId !== filters.projectId) continue;
    if (filters.driver && contract.driverName.trim() !== filters.driver) continue;

    for (const line of contract.bonLines) {
      if (!lineMatchesDateRange(line.lineDate, filters.dateFrom, filters.dateTo)) continue;

      const matId = line.materialId?.trim() || contract.materialId?.trim() || "";
      const label = resolveMaterialLabel(
        matId,
        materials,
        line.designation || line.matricule || contract.designation || "—",
      );

      if (filters.materialName && label.trim() !== filters.materialName) continue;

      const matCategory = matId ? materials.find((m) => m.id === matId)?.materialCategory : undefined;
      if (!materialCategoryMatchesFilter(matCategory, filters.category ?? "")) continue;

      upsert(
        materialKey(matId || null, label),
        matId || null,
        label,
        computeBonLineUsageHours(line),
        0,
        computeBonLineRental(line),
      );
    }
  }

  for (const entry of fuelEntries) {
    if (filters.projectId && entry.projectId !== filters.projectId) continue;
    if (filters.driver && entry.fueledBy.trim() !== filters.driver) continue;
    if (filters.dateFrom && entry.entryDate.slice(0, 10) < filters.dateFrom) continue;
    if (filters.dateTo && entry.entryDate.slice(0, 10) > filters.dateTo) continue;
    if (filters.category && entry.vehicleCategory !== filters.category) continue;

    const matId = entry.materialId?.trim() || "";
    const label = resolveMaterialLabel(matId, materials, entry.equipmentName || "—");

    if (
      filters.materialName &&
      label.trim() !== filters.materialName &&
      entry.equipmentName.trim() !== filters.materialName
    ) {
      continue;
    }

    if (matId) {
      const matCategory = materials.find((m) => m.id === matId)?.materialCategory;
      if (!materialCategoryMatchesFilter(matCategory, filters.category ?? "")) continue;
    }

    const costMad = fuelEntryCostMad(entry);
    const unpricedLitres = costMad > 0 ? 0 : Math.max(0, entry.litres);

    upsert(
      materialKey(matId || null, label),
      matId || null,
      label,
      0,
      entry.litres,
      0,
      costMad,
      unpricedLitres,
    );
  }

  const rows = [...map.values()]
    .filter((r) => r.totalHours > 0 || r.totalLitres > 0 || r.totalRentalMad > 0)
    .sort(
      (a, b) =>
        b.totalRentalMad - a.totalRentalMad ||
        b.totalLitres - a.totalLitres ||
        b.totalHours - a.totalHours,
    );

  const totalUnpricedLitres = rows.reduce((sum, row) => sum + row.unpricedLitres, 0);

  return {
    rows: enrichMaterialUsageWithCost(rows),
    totalUnpricedLitres,
  };
}
