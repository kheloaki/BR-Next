import type { MaterialCategory } from "@/components/admin/operations-types";
import type { DevisTemplate } from "@/components/admin/devis-types";
import { defaultTemplate } from "@/components/admin/devis-types";
import { mapAdminProjectRow } from "@/lib/admin/map-project";
import { mapGasoilContactRow } from "@/lib/admin/map-gasoil-contact";
import {
  bonMatchesDateRange,
  computeBonLineRental,
  mapRentalContractRow,
  parseBonLines,
  usageToDayFraction,
} from "@/lib/admin/map-rental-material";
import { mapRentalMaterialRow, materialLabel } from "@/lib/admin/map-rental-material-catalog";
import { MOVEMENT_SELECT, mapFinanceMovement } from "@/lib/admin/finance-server";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import { nextSituationChNumber } from "@/lib/admin/situation-engins-number";
import {
  gasoilMatchesEngin,
  matchesEnginFilter,
  partsMatchesEngin,
} from "@/lib/admin/situation-engins-match";
import {
  formatActivityQty,
  sortSituationActivityRows,
  type SituationEnginsActivityRow,
} from "@/lib/admin/situation-engins-rows";
import type {
  SituationEnginsBundle,
  SituationEnginsDeduction,
  SituationEnginsGasoilLine,
  SituationEnginsLine,
  SituationEnginsLocationDetail,
  SituationEnginsPartLine,
  SituationEnginsPayment,
} from "@/lib/admin/situation-engins-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildTransportDepartCharges,
  collectFirstEnginUsageByMaterial,
  transportChargeTotal,
} from "@/lib/admin/rental-transport";

const DEDUCTION_SLUGS = new Set(["sous_traitance", "salaire"]);
const ENGIN_CATEGORIES = new Set<MaterialCategory>(["engin"]);

export type SituationEnginsFilters = {
  organizationId: string;
  projectId: string;
  from?: string;
  to?: string;
  /** Catalogue engin id — when set, only this machine is included. */
  materialId?: string;
};

function lineDateInRange(lineDate: string, from?: string, to?: string) {
  if (from && lineDate < from) return false;
  if (to && lineDate > to) return false;
  return true;
}

function formatPeriodLabel(from?: string, to?: string): string {
  if (from) {
    const d = new Date(`${from}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const month = d.toLocaleDateString("fr-FR", { month: "long" });
      const year = d.getFullYear();
      if (to) {
        const end = new Date(`${to}T12:00:00`);
        if (
          !Number.isNaN(end.getTime()) &&
          d.getMonth() === end.getMonth() &&
          d.getFullYear() === end.getFullYear()
        ) {
          const label = month.charAt(0).toUpperCase() + month.slice(1);
          return `${label} ${year}`;
        }
      }
    }
  }
  if (from && to) return `${from} → ${to}`;
  if (from) return `À partir du ${from}`;
  if (to) return `Jusqu'au ${to}`;
  return "Période non définie";
}

function aggregateKey(materialId: string, matricule: string) {
  return materialId?.trim() || matricule.trim().toUpperCase() || "unknown";
}

function mapPartsRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    stockItemId: (r.stock_item_id as string) || null,
    reference: r.reference as string,
    designation: r.designation as string,
    usageType: r.usage_type as "part" | "lubricant",
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    usageDate: String(r.usage_date ?? "").slice(0, 10),
  };
}

async function loadTemplate(organizationId: string): Promise<DevisTemplate> {
  const { data } = await getSupabaseAdminClient()
    .from("admin_templates")
    .select("payload")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return (data?.payload as DevisTemplate | null) ?? defaultTemplate;
}

export async function fetchSituationEnginsBundle(
  filters: SituationEnginsFilters,
): Promise<SituationEnginsBundle | null> {
  const { organizationId, projectId, from, to, materialId: filterMaterialId } = filters;
  const supabase = getSupabaseAdminClient();

  const { data: projectRow, error: projectErr } = await supabase
    .from("admin_projects")
    .select("*")
    .eq("id", projectId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (projectErr) throw new Error(projectErr.message);
  if (!projectRow) return null;

  const project = mapAdminProjectRow(projectRow as Record<string, unknown>);
  const template = await loadTemplate(organizationId);
  const documentNumber = await nextSituationChNumber(organizationId);
  const documentDate = (to || from || new Date().toISOString().slice(0, 10)).slice(0, 10);

  const [{ data: rentalRows }, { data: materialRows }, { data: movementRows }, { data: contactRows }, { data: gasoilRows }, { data: partsRows }] =
    await Promise.all([
      supabase
        .from("admin_rental_contracts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase.from("admin_rental_materials").select("*").eq("organization_id", organizationId),
      supabase
        .from("admin_finance_movements")
        .select(`${MOVEMENT_SELECT}, admin_finance_categories(slug)`)
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .is("voided_at", null)
        .eq("movement_type", "expense")
        .order("movement_date", { ascending: true }),
      supabase
        .from("admin_gasoil_contacts")
        .select("*")
        .eq("organization_id", organizationId),
      supabase
        .from("admin_gasoil_bons")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .eq("bon_type", "sortie")
        .order("bon_date", { ascending: true }),
      supabase
        .from("admin_parts_usage")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .order("usage_date", { ascending: true }),
    ]);

  const materialsById = new Map(
    (materialRows ?? []).map((r) => [r.id as string, mapRentalMaterialRow(r as Record<string, unknown>)]),
  );
  const filterMaterial = filterMaterialId ? materialsById.get(filterMaterialId) : undefined;
  const enginLabel = filterMaterial ? materialLabel(filterMaterial) : undefined;

  type Agg = SituationEnginsLine & { materialId: string };
  const agg = new Map<string, Agg>();
  const locationDetails: SituationEnginsLocationDetail[] = [];
  const driverCounts = new Map<string, number>();
  const ownerCounts = new Map<string, number>();
  const locataireCounts = new Map<string, number>();
  const driverContactIds = new Set<string>();

  for (const raw of rentalRows ?? []) {
    const contract = mapRentalContractRow(raw as Record<string, unknown>);
    if (!bonMatchesDateRange(contract, from ?? "", to ?? "")) continue;

    const lines = contract.bonLines.length > 0 ? contract.bonLines : parseBonLines(raw.bon_lines);
    const fallbackDate = contract.lineDate || String(raw.created_at ?? "").slice(0, 10);

    const processLine = (line: (typeof lines)[number]) => {
      const lineDate = line.lineDate || fallbackDate;
      if (!lineDate || !lineDateInRange(lineDate, from, to)) return;

      const material = line.materialId ? materialsById.get(line.materialId) : undefined;
      const category = material?.materialCategory ?? contract.materialCategory;
      if (!ENGIN_CATEGORIES.has(category)) return;
      if (
        !matchesEnginFilter(
          line.materialId,
          line.matricule || contract.matricule,
          contract.materialId,
          contract.matricule,
          filterMaterialId,
          materialsById,
        )
      ) {
        return;
      }

      const key = aggregateKey(line.materialId, line.matricule || contract.matricule);
      const usageDays = usageToDayFraction(line.usageQty || 0, line.usageUnit || "jour");
      const lineHt = computeBonLineRental(line);
      if (usageDays <= 0 && lineHt <= 0) return;

      const matricule = line.matricule || contract.matricule || material?.matricule || "";
      const designation = line.designation || contract.designation || material?.designation || "";

      locationDetails.push({
        date: lineDate,
        matricule,
        designation,
        bonNo: contract.bonLocationNo || "",
        usageDays: Math.round(usageDays * 100) / 100,
        unitPriceHt: roundMoney(line.dailyRate || contract.dailyRate || material?.dailyRate || 0),
        totalHt: roundMoney(lineHt),
      });

      const existing = agg.get(key);
      if (existing) {
        existing.usageDays += usageDays;
        existing.totalHt += lineHt;
        if (line.dailyRate > 0) existing.unitPriceHt = line.dailyRate;
      } else {
        agg.set(key, {
          materialId: line.materialId,
          matricule,
          designation,
          driverName: contract.driverName || material?.driverName || "",
          unitPriceHt: line.dailyRate || contract.dailyRate || material?.dailyRate || 0,
          usageDays,
          totalHt: lineHt,
        });
      }

      const driver = contract.driverName?.trim();
      if (driver) driverCounts.set(driver, (driverCounts.get(driver) ?? 0) + 1);
      const owner = contract.ownerName?.trim();
      if (owner) ownerCounts.set(owner, (ownerCounts.get(owner) ?? 0) + 1);
      const loc = contract.locataire?.trim();
      if (loc) locataireCounts.set(loc, (locataireCounts.get(loc) ?? 0) + 1);
      if (contract.driverContactId) driverContactIds.add(contract.driverContactId);
    };

    if (lines.length > 0) {
      for (const line of lines) processLine(line);
    } else if (ENGIN_CATEGORIES.has(contract.materialCategory) && fallbackDate && lineDateInRange(fallbackDate, from, to)) {
      if (
        !matchesEnginFilter(
          contract.materialId ?? "",
          contract.matricule,
          contract.materialId,
          contract.matricule,
          filterMaterialId,
          materialsById,
        )
      ) {
        continue;
      }
      const usageDays = contract.daysCount || 0;
      const lineHt = contract.totalMad || contract.dailyRate * usageDays;
      if (usageDays > 0 || lineHt > 0) {
        const key = aggregateKey(contract.materialId ?? "", contract.matricule);
        locationDetails.push({
          date: fallbackDate,
          matricule: contract.matricule,
          designation: contract.designation || contract.equipmentName,
          bonNo: contract.bonLocationNo || "",
          usageDays,
          unitPriceHt: roundMoney(contract.dailyRate),
          totalHt: roundMoney(lineHt),
        });
        const existing = agg.get(key);
        if (existing) {
          existing.usageDays += usageDays;
          existing.totalHt += lineHt;
        } else {
          agg.set(key, {
            materialId: contract.materialId ?? "",
            matricule: contract.matricule,
            designation: contract.designation || contract.equipmentName,
            driverName: contract.driverName,
            unitPriceHt: contract.dailyRate,
            usageDays,
            totalHt: lineHt,
          });
        }
      }
    }
  }

  const sortedLocationDetails = locationDetails.sort((a, b) =>
    a.date.localeCompare(b.date) || a.matricule.localeCompare(b.matricule, "fr"),
  );

  const gasoil: SituationEnginsGasoilLine[] = [];
  for (const raw of gasoilRows ?? []) {
    const row = raw as Record<string, unknown>;
    const bonDate = String(row.bon_date ?? "").slice(0, 10);
    if (!lineDateInRange(bonDate, from, to)) continue;
    if (!gasoilMatchesEngin(row, filterMaterialId, materialsById)) continue;
    const litres = Number(row.litres ?? 0);
    const unitPrice = Number(row.unit_price ?? 0);
    const totalAmount = Number(row.total_amount ?? 0) || litres * unitPrice;
    const materialId = String(row.material_id ?? "");
    const mat = materialId ? materialsById.get(materialId) : undefined;
    gasoil.push({
      date: bonDate,
      number: String(row.number ?? ""),
      matricule: mat?.matricule || String(row.vehicle_label ?? ""),
      equipmentName: String(row.equipment_name ?? mat?.designation ?? ""),
      litres,
      unitPrice: roundMoney(unitPrice),
      totalAmount: roundMoney(totalAmount),
      beneficiary: String(row.beneficiary ?? ""),
    });
  }

  const parts: SituationEnginsPartLine[] = [];
  for (const raw of partsRows ?? []) {
    const part = mapPartsRow(raw as Record<string, unknown>);
    if (!lineDateInRange(part.usageDate, from, to)) continue;
    if (!partsMatchesEngin(part, filterMaterialId, materialsById)) continue;
    const matricule =
      filterMaterial?.matricule ||
      (part.equipmentName.split("—")[0]?.trim() ?? part.equipmentName);
    parts.push({
      date: part.usageDate,
      matricule,
      reference: part.reference,
      designation: part.designation,
      usageType: part.usageType === "lubricant" ? "Lubrifiant" : "Pièce",
      qty: part.qty,
      unitPrice: roundMoney(part.unitPrice),
      totalHt: roundMoney(part.qty * part.unitPrice),
    });
  }

  const gasoilLitres = gasoil.reduce((s, g) => s + g.litres, 0);
  const gasoilCost = roundMoney(gasoil.reduce((s, g) => s + g.totalAmount, 0));
  const partsHt = roundMoney(parts.reduce((s, p) => s + p.totalHt, 0));

  const lines: SituationEnginsLine[] = [...agg.values()]
    .map((row) => ({
      matricule: row.matricule,
      designation: row.designation,
      driverName: row.driverName,
      unitPriceHt: roundMoney(row.unitPriceHt),
      usageDays: Math.round(row.usageDays * 100) / 100,
      totalHt: roundMoney(row.totalHt),
    }))
    .sort((a, b) => a.matricule.localeCompare(b.matricule, "fr"));

  const situationHt = roundMoney(lines.reduce((s, l) => s + l.totalHt, 0));

  const firstUsage = collectFirstEnginUsageByMaterial(
    (rentalRows ?? []) as Record<string, unknown>[],
    projectId,
    materialsById,
  );
  const transportCharges = buildTransportDepartCharges(firstUsage, materialsById, {
    from,
    to,
    materialId: filterMaterialId,
  });
  const transportHt = transportChargeTotal(transportCharges);

  const deductions: SituationEnginsDeduction[] = [];
  const payments: SituationEnginsPayment[] = [];

  if (!filterMaterialId) {
    for (const raw of movementRows ?? []) {
      const row = raw as Record<string, unknown>;
      const movement = mapFinanceMovement(row);
      if (from && movement.movementDate < from) continue;
      if (to && movement.movementDate > to) continue;

      const slug = String((row.admin_finance_categories as { slug?: string } | null)?.slug ?? "");
      const amount = roundMoney(movement.amountHt ?? movement.amount);
      const paidTo = movement.supplierName || movement.customerName || movement.notes?.trim() || "—";
      const paidBy = movement.accountName || "—";

      payments.push({
        label:
          slug === "transport"
            ? "Frais transport"
            : slug === "salaire" || slug === "sous_traitance"
              ? "Paiement main d'œuvre"
              : movement.categoryName || "Paiement",
        date: movement.movementDate,
        amount,
        paidTo,
        paidBy,
      });

      if (DEDUCTION_SLUGS.has(slug)) {
        deductions.push({
          label: slug === "salaire" ? "Paiement Main d'œuvre" : "Paiement sous-traitance",
          beneficiary: paidTo,
          amountHt: amount,
        });
      }
    }
  }

  const deductionsHt = roundMoney(deductions.reduce((s, d) => s + d.amountHt, 0));
  const resteAPayerHt = roundMoney(Math.max(0, situationHt - deductionsHt));

  const pickMostCommon = (counts: Map<string, number>) => {
    let best = "";
    let max = 0;
    for (const [k, v] of counts) {
      if (v > max) {
        max = v;
        best = k;
      }
    }
    return best;
  };

  let driverCin = "";
  const topDriver = pickMostCommon(driverCounts);
  for (const raw of contactRows ?? []) {
    const c = mapGasoilContactRow(raw as Record<string, unknown>);
    if (driverContactIds.has(c.id) || (topDriver && c.name === topDriver)) {
      driverCin = c.cin;
      if (driverCin) break;
    }
  }

  const observation = filterMaterial
    ? `Usage engin — ${materialLabel(filterMaterial)}`
    : project.location?.trim()
      ? `Usage chantier — ${project.location}`
      : `Usage chantier — ${project.name}`;

  const activityRows = sortSituationActivityRows([
    ...sortedLocationDetails.map(
      (l): SituationEnginsActivityRow => ({
        date: l.date,
        kind: "location",
        kindLabel: "Location",
        documentNo: l.bonNo,
        matricule: l.matricule,
        designation: l.designation,
        qtyLabel: formatActivityQty(l.usageDays),
        unitPrice: l.unitPriceHt,
        total: l.totalHt,
        info: "",
      }),
    ),
    ...transportCharges.map(
      (t): SituationEnginsActivityRow => ({
        date: t.date,
        kind: "transport",
        kindLabel: "Transport départ",
        documentNo: t.bonNo,
        matricule: t.matricule,
        designation: t.designation,
        qtyLabel: "1 forfait",
        unitPrice: t.amountHt,
        total: t.amountHt,
        info: "Frais transport engin",
      }),
    ),
    ...gasoil.map(
      (g): SituationEnginsActivityRow => ({
        date: g.date,
        kind: "gasoil",
        kindLabel: "Gasoil",
        documentNo: g.number,
        matricule: g.matricule,
        designation: g.equipmentName,
        qtyLabel: `${g.litres} L`,
        unitPrice: g.unitPrice,
        total: g.totalAmount,
        info: g.beneficiary,
      }),
    ),
    ...parts.map(
      (p): SituationEnginsActivityRow => ({
        date: p.date,
        kind: p.usageType === "Lubrifiant" ? "lubrifiant" : "piece",
        kindLabel: p.usageType,
        documentNo: p.reference,
        matricule: p.matricule,
        designation: p.designation,
        qtyLabel: String(p.qty),
        unitPrice: p.unitPrice,
        total: p.totalHt,
        info: "",
      }),
    ),
  ]);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      documentNumber,
      documentDate,
      periodLabel: formatPeriodLabel(from, to),
      from,
      to,
      project,
      template,
      locataire: pickMostCommon(locataireCounts) || project.clientName || "—",
      loueur: pickMostCommon(ownerCounts) || filterMaterial?.ownerName || "—",
      driverName: topDriver || filterMaterial?.driverName || "—",
      driverCin,
      observation,
      materialId: filterMaterialId,
      enginLabel,
    },
    lines,
    activityRows,
    locationDetails: sortedLocationDetails,
    gasoil,
    parts,
    totals: {
      situationHt,
      transportHt,
      deductionsHt,
      resteAPayerHt,
      gasoilLitres: Math.round(gasoilLitres * 100) / 100,
      gasoilCost,
      partsHt,
    },
    deductions,
    payments,
  };
}

export function situationEnginsToCsv(bundle: SituationEnginsBundle): string {
  const rows = [
    ["Situation de chantier", bundle.meta.documentNumber],
    ["Chantier", `${bundle.meta.project.code} ${bundle.meta.project.name}`.trim()],
    ["Période", bundle.meta.periodLabel],
    ...(bundle.meta.enginLabel ? [["Engin", bundle.meta.enginLabel]] : []),
    [],
    ["Date", "Type", "N° doc.", "Matricule", "Désignation", "Qté", "PU", "Total", "Info"],
    ...bundle.activityRows.map((r) => [
      r.date,
      r.kindLabel,
      r.documentNo,
      r.matricule,
      r.designation,
      r.qtyLabel,
      String(r.unitPrice),
      String(r.total),
      r.info,
    ]),
    [],
    ["Total location HT", String(bundle.totals.situationHt)],
    ["Total transport départ HT", String(bundle.totals.transportHt)],
    ["Total gasoil L", String(bundle.totals.gasoilLitres)],
    ["Total gasoil MAD", String(bundle.totals.gasoilCost)],
    ["Total pièces HT", String(bundle.totals.partsHt)],
    ["Reste à payer HT (location)", String(bundle.totals.resteAPayerHt)],
  ];
  return rows.map((r) => r.join(";")).join("\n");
}
