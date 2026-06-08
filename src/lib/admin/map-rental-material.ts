import type {
  MaterialCategory,
  MaterialTransportMode,
  RentalBonLine,
  RentalContract,
  RentalEquipmentStatus,
  RentalMaterial,
} from "@/components/admin/operations-types";
import { RENTAL_HOURS_PER_DAY } from "@/components/admin/operations-types";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";

export const RENTAL_LOCATAIRE_DEFAULT = "BARANE INVEST";

export function usageToDayFraction(qty: number, unit: "jour" | "heure") {
  const q = Number(qty) || 0;
  if (unit === "heure") return q / RENTAL_HOURS_PER_DAY;
  return q;
}

export function computeBonLineRental(line: RentalBonLine) {
  const rate = Number(line.dailyRate) || 0;
  const qty = Number(line.usageQty) || 1;
  const unit = line.usageUnit || "jour";
  return rate * usageToDayFraction(qty, unit);
}

export function computeEstimatedHours(daysCount: number) {
  return Math.max(0, daysCount) * RENTAL_HOURS_PER_DAY;
}

export function computeBonLineUsageHours(line: RentalBonLine): number {
  const qty = Number(line.usageQty) || 0;
  if (line.usageUnit === "heure") return qty;
  return qty * RENTAL_HOURS_PER_DAY;
}

export function computeBonLinesUsageHours(lines: RentalBonLine[]): number {
  return lines.reduce((s, l) => s + computeBonLineUsageHours(l), 0);
}

export function parseBonLines(raw: unknown): RentalBonLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const o = item as Record<string, unknown>;
      return {
        lineDate: String(o.lineDate ?? o.line_date ?? "").slice(0, 10),
        materialId: String(o.materialId ?? o.material_id ?? ""),
        matricule: String(o.matricule ?? ""),
        designation: String(o.designation ?? ""),
        dailyRate: Number(o.dailyRate ?? o.daily_rate ?? 0),
        usageQty: Number(o.usageQty ?? o.usage_qty ?? 1) || 1,
        usageUnit: (o.usageUnit ?? o.usage_unit ?? "jour") === "heure" ? ("heure" as const) : ("jour" as const),
      };
    })
    .filter((l) => l.lineDate || l.designation || l.matricule || l.dailyRate > 0);
}

export function computeBonLinesTotal(lines: RentalBonLine[]) {
  return lines.reduce((s, l) => s + computeBonLineRental(l), 0);
}

export function computeRentalTotalMad(row: {
  daily_rate?: number | null;
  days_count?: number | null;
  transport_mode?: string | null;
  transport_price?: number | null;
  hourly_rate?: number | null;
  hours_worked?: number | null;
  gasoil?: number | null;
  bon_lines?: unknown;
}) {
  const lines = parseBonLines(row.bon_lines);
  if (lines.length > 0) return computeBonLinesTotal(lines);

  const dailyRate = Number(row.daily_rate ?? 0);
  const daysCount = Number(row.days_count ?? 0);
  if (dailyRate > 0 && daysCount > 0) {
    const base = dailyRate * daysCount;
    const transport =
      row.transport_mode === "depart" ? Number(row.transport_price ?? 0) : 0;
    return base + transport;
  }
  return Number(row.hourly_rate ?? 0) * Number(row.hours_worked ?? 0);
}

export function getBonLocationDates(r: {
  lineDate: string | null;
  bonLines: RentalBonLine[];
}): string[] {
  const dates = [...new Set(r.bonLines.map((l) => l.lineDate).filter(Boolean))].sort();
  if (dates.length > 0) return dates;
  return r.lineDate ? [r.lineDate] : [];
}

export function bonMatchesDateRange(
  r: { lineDate: string | null; bonLines: RentalBonLine[] },
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const dates = getBonLocationDates(r);
  if (dates.length === 0) return false;
  return dates.some((d) => {
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
}

export function bonMatchesMaterial(
  r: { materialId: string | null; bonLines: RentalBonLine[] },
  materialId: string,
): boolean {
  if (!materialId) return true;
  if (r.materialId === materialId) return true;
  return r.bonLines.some((l) => l.materialId === materialId);
}

export function formatBonLocationMaterials(
  r: { materialId: string | null; bonLines: RentalBonLine[]; designation: string; reference: string; matricule: string },
  materials: RentalMaterial[],
): string {
  const labels = r.bonLines.map((line) => {
    const m = materials.find((x) => x.id === line.materialId);
    if (m) return materialLabel(m);
    return line.matricule || line.designation || "";
  });
  const unique = [...new Set(labels.filter(Boolean))];
  if (unique.length > 0) return unique.join(", ");
  if (r.materialId) {
    const m = materials.find((x) => x.id === r.materialId);
    if (m) return materialLabel(m);
  }
  return r.designation || r.reference || r.matricule || "—";
}

export function formatBonLocationDates(r: {
  lineDate: string | null;
  bonLines: RentalBonLine[];
}) {
  const dates = getBonLocationDates(r);
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("fr-MA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  if (dates.length === 0) return r.lineDate ? fmt(r.lineDate) : "—";
  if (dates.length === 1) return fmt(dates[0]!);
  return `${fmt(dates[0]!)} → ${fmt(dates[dates.length - 1]!)}`;
}

export function mapRentalContractRow(r: Record<string, unknown>): RentalContract {
  const bonLines = parseBonLines(r.bon_lines);
  const dailyRate = Number(r.daily_rate ?? 0);
  const daysCount =
    bonLines.length > 0
      ? bonLines.reduce((s, l) => s + usageToDayFraction(l.usageQty || 1, l.usageUnit || "jour"), 0)
      : Number(r.days_count ?? 0);
  const hourlyRate = Number(r.hourly_rate ?? 0);
  const hoursWorked = Number(r.hours_worked ?? 0);
  const designation = (r.designation as string) || (r.equipment_name as string) || "";
  const lineDate = r.line_date
    ? String(r.line_date).slice(0, 10)
    : bonLines.find((l) => l.lineDate)?.lineDate || null;

  return {
    id: r.id as string,
    materialId: (r.material_id as string) || null,
    projectId: (r.project_id as string) || null,
    locataire: (r.locataire as string) || RENTAL_LOCATAIRE_DEFAULT,
    materialCategory: ((r.material_category as string) || "engin") as MaterialCategory,
    reference: (r.reference as string) || "",
    matricule: (r.matricule as string) || "",
    designation,
    subCategory: (r.sub_category as string) || "",
    ownerName: (r.owner_name as string) || "",
    employeeId: (r.employee_id as string) || null,
    driverName: (r.driver_name as string) || "",
    driverContactId: (r.driver_contact_id as string) || null,
    dailyRate,
    daysCount,
    estimatedHours: computeEstimatedHours(daysCount),
    lineDate,
    gasoil: Number(r.gasoil ?? 0),
    bonLines,
    transportMode: ((r.transport_mode as string) || "") as MaterialTransportMode,
    transportPrice: Number(r.transport_price ?? 0),
    equipmentName: (r.equipment_name as string) || designation,
    bonLocationNo: (r.contract_no as string) || "",
    contractNo: (r.contract_no as string) || "",
    hourlyRate,
    hoursWorked,
    hoursStopped: Number(r.hours_stopped ?? 0),
    hoursDown: Number(r.hours_down ?? 0),
    totalMad: computeRentalTotalMad(r),
    status: r.status as RentalEquipmentStatus,
  };
}

export type RentalBonLineBody = {
  lineDate: string;
  materialId?: string;
  matricule?: string;
  designation?: string;
  dailyRate?: number;
  usageQty?: number;
  usageUnit?: "jour" | "heure";
};

export type RentalBonBody = {
  id?: string;
  materialId?: string;
  projectId?: string;
  locataire?: string;
  materialCategory?: MaterialCategory;
  reference?: string;
  matricule?: string;
  designation?: string;
  subCategory?: string;
  ownerName?: string;
  employeeId?: string | null;
  driverName?: string;
  driverContactId?: string | null;
  dailyRate?: number;
  daysCount?: number;
  transportMode?: MaterialTransportMode;
  transportPrice?: number;
  lines?: RentalBonLineBody[];
  equipmentName?: string;
  bonLocationNo?: string;
  contractNo?: string;
  hourlyRate?: number;
  hoursWorked?: number;
  status?: RentalEquipmentStatus;
};

export function resolveEquipmentName(body: RentalBonBody) {
  const designation = body.designation?.trim() || body.lines?.[0]?.designation?.trim() || "";
  if (designation) return designation;
  const ref = body.reference?.trim() || body.matricule?.trim() || body.lines?.[0]?.matricule?.trim() || "";
  return ref;
}

export function contractToBonForm(r: RentalContract): {
  bonLocationNo: string;
  projectId: string;
  locataire: string;
  ownerName: string;
  driverName: string;
  driverContactId: string;
  employeeId: string;
  lines: RentalBonLine[];
  status: RentalEquipmentStatus;
} {
  const lines =
    r.bonLines.length > 0
      ? r.bonLines
      : [
          {
            lineDate: r.lineDate || new Date().toISOString().slice(0, 10),
            materialId: r.materialId ?? "",
            matricule: r.matricule,
            designation: r.designation,
            dailyRate: r.dailyRate,
            usageQty: 1,
            usageUnit: "jour" as const,
          },
        ];

  return {
    bonLocationNo: r.bonLocationNo,
    projectId: r.projectId ?? "",
    locataire: r.locataire,
    ownerName: r.ownerName,
    driverName: r.driverName,
    driverContactId: r.driverContactId ?? "",
    employeeId: r.employeeId ?? "",
    lines,
    status: r.status,
  };
}

export function emptyBonLine(): RentalBonLine {
  return {
    lineDate: new Date().toISOString().slice(0, 10),
    materialId: "",
    matricule: "",
    designation: "",
    dailyRate: 0,
    usageQty: 1,
    usageUnit: "jour",
  };
}
