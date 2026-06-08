import type { MaterialCategory, MaterialTransportMode, RentalLocationMode } from "@/components/admin/operations-types";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";

export function mapRentalMaterialRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    materialCategory: ((r.material_category as string) || "engin") as MaterialCategory,
    projectId: (r.project_id as string) || null,
    reference: (r.reference as string) || "",
    matricule: (r.matricule as string) || "",
    designation: r.designation as string,
    subCategory: (r.sub_category as string) || "",
    ownerName: (r.owner_name as string) || "",
    supplierId: (r.supplier_id as string) || "",
    employeeId: (r.employee_id as string) || null,
    driverName: (r.driver_name as string) || "",
    driverContactId: (r.driver_contact_id as string) || null,
    rentalMode: ((r.rental_mode as string) || "jour") as RentalLocationMode,
    contractStartDate: (r.contract_start_date as string) || null,
    contractEndDate: (r.contract_end_date as string) || null,
    contractOpenEnded: Boolean(r.contract_open_ended),
    dailyRate: Number(r.daily_rate) || 0,
    daysCount: Number(r.days_count) || 0,
    monthlyPriceHt: Number(r.monthly_price_ht) || 0,
    forfaitPriceHt: Number(r.forfait_price_ht) || 0,
    vatRate: Number(r.vat_rate ?? DEFAULT_VAT_RATE),
    transportMode: ((r.transport_mode as string) || "") as MaterialTransportMode,
    transportPrice: Number(r.transport_price) || 0,
    active: Boolean(r.active ?? true),
  };
}

export type RentalMaterialBody = {
  id?: string;
  materialCategory?: MaterialCategory;
  projectId?: string | null;
  reference?: string;
  matricule?: string;
  designation?: string;
  subCategory?: string;
  ownerName?: string;
  supplierId?: string | null;
  employeeId?: string | null;
  driverName?: string;
  driverContactId?: string | null;
  rentalMode?: RentalLocationMode;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  contractOpenEnded?: boolean;
  dailyRate?: number;
  daysCount?: number;
  monthlyPriceHt?: number;
  forfaitPriceHt?: number;
  vatRate?: number;
  transportMode?: MaterialTransportMode;
  transportPrice?: number;
  active?: boolean;
};

export function materialLabel(m: {
  materialCategory: MaterialCategory;
  reference: string;
  matricule: string;
  designation: string;
}) {
  const id = m.reference || m.matricule;
  return id ? `${id} — ${m.designation}` : m.designation;
}

export function rentalMaterialPriceSummary(m: {
  rentalMode: RentalLocationMode;
  dailyRate: number;
  monthlyPriceHt: number;
  forfaitPriceHt: number;
  vatRate: number;
}) {
  const vat = m.vatRate || DEFAULT_VAT_RATE;
  if (m.rentalMode === "mois") {
    if (m.monthlyPriceHt <= 0) return "—";
    return `${formatMoney(m.monthlyPriceHt)} HT · ${formatMoney(htToTtc(m.monthlyPriceHt, vat))} TTC/mois`;
  }
  if (m.rentalMode === "forfait") {
    if (m.forfaitPriceHt <= 0) return "—";
    return `${formatMoney(m.forfaitPriceHt)} HT · ${formatMoney(htToTtc(m.forfaitPriceHt, vat))} TTC forfait`;
  }
  if (m.dailyRate <= 0) return "—";
  return `${formatMoney(m.dailyRate)} HT · ${formatMoney(htToTtc(m.dailyRate, vat))} TTC/jr`;
}

export function materialMatchesDateRange(
  m: {
    contractStartDate: string | null;
    contractEndDate: string | null;
    contractOpenEnded: boolean;
  },
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const start = m.contractStartDate?.slice(0, 10) || "";
  const end = m.contractOpenEnded ? "" : m.contractEndDate?.slice(0, 10) || "";
  if (!start && !end) return false;
  const from = dateFrom || "0000-01-01";
  const to = dateTo || "9999-12-31";
  const rangeStart = start || end;
  const rangeEnd = m.contractOpenEnded ? to : end || start;
  return rangeStart <= to && rangeEnd >= from;
}
