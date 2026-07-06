import type { GasoilBonType, GasoilVehicleCategory } from "@/components/admin/operations-types";
import type { AdminCsvMeta } from "@/lib/admin/admin-csv-export";
import { formatDateFr } from "@/lib/admin/date-time-fr";
import { GASOIL_BON_TYPES, GASOIL_VEHICLE_CATEGORIES, GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";

export type GasoilBonListFilters = {
  bonType?: GasoilBonType;
  projectId?: string;
  vehicleCategory?: GasoilVehicleCategory;
  material?: string;
  person?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
};

export type GasoilBonFilterRow = {
  number: string;
  bonType: GasoilBonType;
  projectId: string | null;
  vehicleCategory: GasoilVehicleCategory;
  equipmentName: string;
  vehicleLabel: string;
  beneficiary: string;
  supplier: string;
  bonDate: string;
};

const EXPORT_QUERY_KEYS = [
  "bonType",
  "projectId",
  "vehicleCategory",
  "material",
  "person",
  "from",
  "to",
  "q",
] as const;

function pick(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseGasoilBonListFilters(searchParams: URLSearchParams): GasoilBonListFilters {
  const bonTypeRaw = pick(searchParams.get("bonType"));
  const bonType =
    bonTypeRaw && GASOIL_BON_TYPES.includes(bonTypeRaw as GasoilBonType)
      ? (bonTypeRaw as GasoilBonType)
      : undefined;

  const categoryRaw = pick(searchParams.get("vehicleCategory"));
  const vehicleCategory =
    categoryRaw && GASOIL_VEHICLE_CATEGORIES.includes(categoryRaw as GasoilVehicleCategory)
      ? (categoryRaw as GasoilVehicleCategory)
      : undefined;

  return {
    bonType,
    projectId: pick(searchParams.get("projectId")),
    vehicleCategory,
    material: pick(searchParams.get("material")),
    person: pick(searchParams.get("person")),
    dateFrom: pick(searchParams.get("from"))?.slice(0, 10),
    dateTo: pick(searchParams.get("to"))?.slice(0, 10),
    q: pick(searchParams.get("q")),
  };
}

export function buildGasoilBonListQuery(filters: GasoilBonListFilters): string {
  const params = new URLSearchParams();
  if (filters.bonType) params.set("bonType", filters.bonType);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.vehicleCategory) params.set("vehicleCategory", filters.vehicleCategory);
  if (filters.material) params.set("material", filters.material);
  if (filters.person) params.set("person", filters.person);
  if (filters.dateFrom) params.set("from", filters.dateFrom);
  if (filters.dateTo) params.set("to", filters.dateTo);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function gasoilBonListFiltersFromPanelState(input: {
  fixedBonType: GasoilBonType;
  filterProjectId: string;
  filterCategory: string;
  filterMaterial: string;
  filterPerson: string;
  filterDateFrom: string;
  filterDateTo: string;
  search: string;
}): GasoilBonListFilters {
  const vehicleCategory =
    input.filterCategory &&
    GASOIL_VEHICLE_CATEGORIES.includes(input.filterCategory as GasoilVehicleCategory)
      ? (input.filterCategory as GasoilVehicleCategory)
      : undefined;

  return {
    bonType: input.fixedBonType,
    projectId: input.filterProjectId || undefined,
    vehicleCategory,
    material: input.filterMaterial || undefined,
    person: input.filterPerson || undefined,
    dateFrom: input.filterDateFrom || undefined,
    dateTo: input.filterDateTo || undefined,
    q: input.search.trim() || undefined,
  };
}

export function filterGasoilBons<T extends GasoilBonFilterRow>(
  rows: T[],
  filters: GasoilBonListFilters,
  ctx: { isCommande: boolean; projectName: (id: string | null) => string },
): T[] {
  let list = rows;

  if (filters.bonType) {
    list = list.filter((r) => r.bonType === filters.bonType);
  }
  if (filters.projectId) {
    list = list.filter((r) => r.projectId === filters.projectId);
  }
  if (filters.vehicleCategory) {
    list = list.filter((r) => r.vehicleCategory === filters.vehicleCategory);
  }
  if (filters.material) {
    list = list.filter(
      (r) => (r.equipmentName.trim() || r.vehicleLabel.trim()) === filters.material,
    );
  }
  if (filters.person) {
    list = list.filter(
      (r) => (ctx.isCommande ? r.supplier : r.beneficiary).trim() === filters.person,
    );
  }
  if (filters.dateFrom) {
    list = list.filter((r) => r.bonDate.slice(0, 10) >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    list = list.filter((r) => r.bonDate.slice(0, 10) <= filters.dateTo!);
  }

  const q = filters.q?.trim().toLowerCase();
  if (!q) return list;

  return list.filter(
    (r) =>
      r.number.toLowerCase().includes(q) ||
      ctx.projectName(r.projectId).toLowerCase().includes(q) ||
      r.equipmentName.toLowerCase().includes(q) ||
      r.vehicleLabel.toLowerCase().includes(q) ||
      r.beneficiary.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory].toLowerCase().includes(q),
  );
}

export function gasoilBonListFilterMeta(
  filters: GasoilBonListFilters,
  ctx: { isCommande: boolean; projectName: (id: string) => string },
): AdminCsvMeta["filters"] {
  const out: NonNullable<AdminCsvMeta["filters"]> = [];
  const BON_TYPE_LABELS: Record<GasoilBonType, string> = { achat: "Achat", sortie: "Sortie" };

  if (filters.bonType) {
    out.push({ label: "Type bon", value: BON_TYPE_LABELS[filters.bonType] });
  }
  if (filters.projectId) {
    out.push({ label: "Chantier", value: ctx.projectName(filters.projectId) });
  }
  if (filters.vehicleCategory) {
    out.push({
      label: "Catégorie",
      value: GASOIL_VEHICLE_CATEGORY_LABELS[filters.vehicleCategory],
    });
  }
  if (filters.material) {
    out.push({ label: "Matériel", value: filters.material });
  }
  if (filters.person) {
    out.push({
      label: ctx.isCommande ? "Fournisseur" : "Conducteur",
      value: filters.person,
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? formatDateFr(filters.dateFrom) : "…";
    const to = filters.dateTo ? formatDateFr(filters.dateTo) : "…";
    out.push({ label: "Période", value: `Du ${from} au ${to}` });
  }
  if (filters.q) {
    out.push({ label: "Recherche", value: filters.q });
  }
  return out.length > 0 ? out : undefined;
}

export function gasoilBonExportBasePath(filters: GasoilBonListFilters): string {
  return `/api/admin/fuel/bons${buildGasoilBonListQuery(filters)}`;
}

export { EXPORT_QUERY_KEYS };
