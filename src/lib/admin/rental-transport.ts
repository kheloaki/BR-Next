import type { MaterialCategory, RentalBonLine } from "@/components/admin/operations-types";
import {
  mapRentalContractRow,
  parseBonLines,
} from "@/lib/admin/map-rental-material";
import type { mapRentalMaterialRow } from "@/lib/admin/map-rental-material-catalog";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

const TRANSPORT_CATEGORIES = new Set<MaterialCategory>(["engin", "groupe_electrogen"]);

export type RentalMaterialTransport = ReturnType<typeof mapRentalMaterialRow>;

export type EnginFirstUsage = {
  materialId: string;
  date: string;
  bonNo: string;
  matricule: string;
  designation: string;
};

export type TransportDepartCharge = EnginFirstUsage & {
  amountHt: number;
};

type MaterialLike = {
  materialCategory: MaterialCategory;
  transportMode: string;
  transportPrice: number;
  matricule?: string;
  designation?: string;
};

function lineDateInRange(lineDate: string, from?: string, to?: string) {
  if (from && lineDate < from) return false;
  if (to && lineDate > to) return false;
  return true;
}

function isTransportDepartMaterial(m: MaterialLike | undefined): m is MaterialLike & { transportPrice: number } {
  return Boolean(m && m.transportMode === "depart" && m.transportPrice > 0);
}

/** Earliest rental bon line per engin on a chantier. */
export function collectFirstEnginUsageByMaterial(
  rentalRows: Record<string, unknown>[],
  projectId: string,
  materialsById: Map<string, RentalMaterialTransport>,
): Map<string, EnginFirstUsage> {
  const first = new Map<string, EnginFirstUsage>();

  const consider = (materialId: string, lineDate: string, bonNo: string, matricule: string, designation: string) => {
    if (!materialId || !lineDate) return;
    const material = materialsById.get(materialId);
    if (material && !TRANSPORT_CATEGORIES.has(material.materialCategory)) return;

    const existing = first.get(materialId);
    if (!existing || lineDate < existing.date) {
      first.set(materialId, {
        materialId,
        date: lineDate,
        bonNo,
        matricule: matricule || material?.matricule || "",
        designation: designation || material?.designation || "",
      });
    }
  };

  for (const raw of rentalRows) {
    const contract = mapRentalContractRow(raw);
    if (contract.projectId !== projectId) continue;

    const lines =
      contract.bonLines.length > 0 ? contract.bonLines : parseBonLines(raw.bon_lines);
    const fallbackDate = contract.lineDate || String(raw.created_at ?? "").slice(0, 10);
    const bonNo = contract.bonLocationNo || "";

    if (lines.length > 0) {
      for (const line of lines) {
        const materialId = line.materialId || contract.materialId || "";
        consider(
          materialId,
          line.lineDate || fallbackDate,
          bonNo,
          line.matricule || contract.matricule,
          line.designation || contract.designation,
        );
      }
      continue;
    }

    if (contract.materialId && fallbackDate) {
      consider(
        contract.materialId,
        fallbackDate,
        bonNo,
        contract.matricule,
        contract.designation || contract.equipmentName,
      );
    }
  }

  return first;
}

export function buildTransportDepartCharges(
  firstUsage: Map<string, EnginFirstUsage>,
  materialsById: Map<string, RentalMaterialTransport>,
  filters?: { from?: string; to?: string; materialId?: string },
): TransportDepartCharge[] {
  const charges: TransportDepartCharge[] = [];

  for (const usage of firstUsage.values()) {
    if (filters?.materialId && usage.materialId !== filters.materialId) continue;
    if (!lineDateInRange(usage.date, filters?.from, filters?.to)) continue;

    const material = materialsById.get(usage.materialId);
    if (!isTransportDepartMaterial(material)) continue;

    charges.push({
      ...usage,
      matricule: usage.matricule || material.matricule,
      designation: usage.designation || material.designation,
      amountHt: roundMoney(material.transportPrice),
    });
  }

  return charges.sort(
    (a, b) => a.date.localeCompare(b.date) || a.matricule.localeCompare(b.matricule, "fr"),
  );
}

export function transportChargeTotal(charges: TransportDepartCharge[]) {
  return roundMoney(charges.reduce((s, c) => s + c.amountHt, 0));
}

export function contractHasTransportDepart(raw: Record<string, unknown>) {
  return raw.transport_mode === "depart" && Number(raw.transport_price ?? 0) > 0;
}

/** True if transport départ was already recorded on another bon for this engin + chantier. */
export async function transportDepartAlreadyCharged(
  supabase: Supabase,
  organizationId: string,
  projectId: string,
  materialId: string,
  excludeContractId?: string,
): Promise<boolean> {
  let query = supabase
    .from("admin_rental_contracts")
    .select("id, material_id, bon_lines, transport_mode, transport_price")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .eq("transport_mode", "depart")
    .gt("transport_price", 0);

  if (excludeContractId) {
    query = query.neq("id", excludeContractId);
  }

  const { data } = await query;
  for (const row of data ?? []) {
    if ((row.material_id as string) === materialId) return true;
    const lines = parseBonLines(row.bon_lines);
    if (lines.some((l: RentalBonLine) => l.materialId === materialId)) return true;
  }
  return false;
}

export function resolveBonTransportFromMaterials(
  materialIds: string[],
  materialsById: Map<string, { transport_mode?: string; transport_price?: number }>,
  alreadyChargedMaterialIds: Set<string>,
): { transport_mode: string; transport_price: number } {
  for (const id of materialIds) {
    if (alreadyChargedMaterialIds.has(id)) continue;
    const m = materialsById.get(id);
    if (m?.transport_mode === "depart" && Number(m.transport_price ?? 0) > 0) {
      return { transport_mode: "depart", transport_price: Number(m.transport_price) };
    }
  }
  return { transport_mode: "", transport_price: 0 };
}
