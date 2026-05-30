import type {
  MaterialCategory,
  MaterialTransportMode,
  RentalContract,
  RentalEquipmentStatus,
} from "@/components/admin/operations-types";
import { RENTAL_HOURS_PER_DAY } from "@/components/admin/operations-types";

export function computeEstimatedHours(daysCount: number) {
  return Math.max(0, daysCount) * RENTAL_HOURS_PER_DAY;
}

export function computeRentalTotalMad(row: {
  daily_rate?: number | null;
  days_count?: number | null;
  transport_mode?: string | null;
  transport_price?: number | null;
  hourly_rate?: number | null;
  hours_worked?: number | null;
}) {
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

export function mapRentalContractRow(r: Record<string, unknown>): RentalContract {
  const dailyRate = Number(r.daily_rate ?? 0);
  const daysCount = Number(r.days_count ?? 0);
  const hourlyRate = Number(r.hourly_rate ?? 0);
  const hoursWorked = Number(r.hours_worked ?? 0);
  const designation = (r.designation as string) || (r.equipment_name as string) || "";
  return {
    id: r.id as string,
    materialId: (r.material_id as string) || null,
    projectId: (r.project_id as string) || null,
    materialCategory: ((r.material_category as string) || "engin") as MaterialCategory,
    reference: (r.reference as string) || "",
    matricule: (r.matricule as string) || "",
    designation,
    subCategory: (r.sub_category as string) || "",
    ownerName: (r.owner_name as string) || "",
    employeeId: (r.employee_id as string) || null,
    driverName: (r.driver_name as string) || "",
    dailyRate,
    daysCount,
    estimatedHours: computeEstimatedHours(daysCount),
    transportMode: ((r.transport_mode as string) || "") as MaterialTransportMode,
    transportPrice: Number(r.transport_price ?? 0),
    equipmentName: (r.equipment_name as string) || designation,
    bonLocationNo: (r.contract_no as string) || "",
    contractNo: (r.contract_no as string) || "",
    hourlyRate,
    hoursWorked,
    hoursStopped: Number(r.hours_stopped ?? 0),
    hoursDown: Number(r.hours_down ?? 0),
    totalMad: computeRentalTotalMad(r as Record<string, unknown>),
    status: r.status as RentalEquipmentStatus,
  };
}

export type RentalBonBody = {
  id?: string;
  materialId?: string;
  projectId?: string;
  materialCategory?: MaterialCategory;
  reference?: string;
  matricule?: string;
  designation?: string;
  subCategory?: string;
  ownerName?: string;
  employeeId?: string | null;
  driverName?: string;
  dailyRate?: number;
  daysCount?: number;
  transportMode?: MaterialTransportMode;
  transportPrice?: number;
  equipmentName?: string;
  bonLocationNo?: string;
  contractNo?: string;
  hourlyRate?: number;
  hoursWorked?: number;
  status?: RentalEquipmentStatus;
};

export function resolveEquipmentName(body: RentalBonBody) {
  const designation = body.designation?.trim() || "";
  if (designation) return designation;
  const ref = body.reference?.trim() || body.matricule?.trim() || "";
  return ref;
}
