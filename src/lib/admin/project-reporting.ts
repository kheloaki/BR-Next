import type {
  AttendanceRecord,
  DrillingReport,
  FuelEntry,
  PartsUsage,
  ProductionEntry,
  PurchaseRequest,
  Trip,
} from "@/components/admin/operations-types";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { defaultTemplate } from "@/components/admin/devis-types";
import type { DevisTemplate } from "@/components/admin/devis-types";
import { mapPurchaseRequestRow } from "@/lib/admin/map-purchase-request";
import { mapBonToFuelEntry } from "@/lib/admin/fuel-bon-sync";
import { mapAdminProjectRow } from "@/lib/admin/map-project";
import { mapRentalContractRow } from "@/lib/admin/map-rental-material";
import { mapRentalMaterialRow } from "@/lib/admin/map-rental-material-catalog";
import { mapStockMovementRow } from "@/lib/admin/map-stock-movement";
import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import {
  computeFacturationTotals,
  computeProfitabilityLines,
  computeRentalTotals,
  computeStockTotals,
  dateInRange,
  sumGasoilCost,
  sumGasoilSortieLitres,
  sumTraitementAchats,
  sumTraitementVentes,
  traitementLinesTotal,
} from "@/lib/admin/project-report-calculations";
import type {
  GasoilBonReport,
  ProjectReportBundle,
  ProjectReportFilters,
  RentalMaterialReport,
} from "@/lib/admin/project-report-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapGasoilBonRow(r: Record<string, unknown>): GasoilBonReport {
  const litres = Number(r.litres ?? 0);
  const unitPrice = Number(r.unit_price ?? 0);
  const totalAmount = Number(r.total_amount ?? 0) || litres * unitPrice;
  return {
    id: r.id as string,
    number: (r.number as string) || "",
    bonType: r.bon_type as GasoilBonReport["bonType"],
    bonDate: r.bon_date as string,
    litres,
    unitPrice,
    totalAmount,
    supplier: (r.supplier as string) || "",
    equipmentName: (r.equipment_name as string) || "",
    vehicleLabel: (r.vehicle_label as string) || "",
    siteName: (r.site_name as string) || "",
    projectId: (r.project_id as string) || null,
    deliveryNote: (r.delivery_note as string) || "",
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
  };
}

function mapProd(r: Record<string, unknown>): ProductionEntry {
  return {
    id: r.id as string,
    entryDate: r.entry_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    tonnage: Number(r.tonnage ?? 0),
    targetTonnage: Number(r.target_tonnage ?? 0),
    material: r.material as string,
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    stopReason: r.stop_reason as string,
    shippedTonnage: Number(r.shipped_tonnage ?? 0),
    stockTonnage: Number(r.stock_tonnage ?? 0),
    shiftLead: r.shift_lead as string,
    notes: r.notes as string,
  };
}

function mapDrill(r: Record<string, unknown>): DrillingReport {
  return {
    id: r.id as string,
    reportDate: r.report_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    rigName: r.rig_name as string,
    operatorName: r.operator_name as string,
    depthStart: Number(r.depth_start ?? 0),
    depthEnd: Number(r.depth_end ?? 0),
    metersDrilled: Math.max(0, Number(r.depth_end ?? 0) - Number(r.depth_start ?? 0)),
    targetMeters: Number(r.target_meters ?? 0),
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    diameterMm: r.diameter_mm != null ? Number(r.diameter_mm) : null,
    incidents: r.incidents as string,
  };
}

function mapAtt(r: Record<string, unknown>): AttendanceRecord {
  return {
    id: r.id as string,
    employeeId: (r.employee_id as string) || "",
    employeeName: r.employee_name as string,
    matricule: r.matricule as string,
    role: r.role as string,
    recordDate: r.record_date as string,
    timeIn: r.time_in as string,
    timeOut: r.time_out as string,
    status: r.status as AttendanceRecord["status"],
    overtimeHours: Number(r.overtime_hours ?? 0),
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    task: r.task as string,
    notes: r.notes as string,
  };
}

function mapParts(r: Record<string, unknown>): PartsUsage {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    stockItemId: (r.stock_item_id as string) || null,
    reference: r.reference as string,
    designation: r.designation as string,
    usageType: r.usage_type as PartsUsage["usageType"],
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    usageDate: r.usage_date as string,
  };
}

function mapTrip(r: Record<string, unknown>): Trip {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    tripDate: r.trip_date as string,
    vehicleCode: r.vehicle_code as string,
    plate: r.plate as string,
    driverName: r.driver_name as string,
    departure: r.departure as string,
    destination: r.destination as string,
    loadType: r.load_type as string,
    distanceKm: Number(r.distance_km ?? 0),
    deliveryNote: r.delivery_note as string,
    status: r.status as Trip["status"],
  };
}

function mapDa(r: Record<string, unknown>): PurchaseRequest {
  return mapPurchaseRequestRow(r);
}

function mapQuoteRow(row: { id: string; payload: unknown; created_at: string }): QuoteDraft {
  const payload = (row.payload as QuoteDraft) ?? ({} as QuoteDraft);
  return {
    ...payload,
    id: row.id,
    createdAt: payload.createdAt ?? row.created_at,
  };
}

function periodLabel(from?: string, to?: string): string {
  if (from && to) return `${from} → ${to}`;
  if (from) return `À partir du ${from}`;
  if (to) return `Jusqu'au ${to}`;
  return "Toute la période";
}

async function loadTemplate(organizationId: string): Promise<DevisTemplate> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("admin_templates")
    .select("payload")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return (data?.payload as DevisTemplate | null) ?? defaultTemplate;
}

async function rowsForProject(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  table: string,
  projectId: string,
  orderCol: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order(orderCol, { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

function quoteIdsFromTraitements(traitementRows: Record<string, unknown>[]): string[] {
  const ids = new Set<string>();
  for (const row of traitementRows) {
    const steps = row.steps as Record<string, { quoteId?: string }> | null;
    if (!steps || typeof steps !== "object") continue;
    for (const step of Object.values(steps)) {
      const qid = step?.quoteId?.trim();
      if (qid) ids.add(qid);
    }
  }
  return [...ids];
}

/** Works with or without admin_quotes.project_id (patch 32). */
async function loadProjectQuotes(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  projectId: string,
  traitementRows: Record<string, unknown>[],
): Promise<QuoteDraft[]> {
  const { data: byPayload, error: payloadErr } = await supabase
    .from("admin_quotes")
    .select("id, payload, created_at")
    .eq("organization_id", organizationId)
    .filter("payload->>projectId", "eq", projectId)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (payloadErr) throw new Error(payloadErr.message);

  const rows = [...(byPayload ?? [])];
  const seen = new Set(rows.map((r) => r.id as string));
  const linkedIds = quoteIdsFromTraitements(traitementRows).filter((id) => !seen.has(id));

  if (linkedIds.length > 0) {
    const { data: linked, error: linkedErr } = await supabase
      .from("admin_quotes")
      .select("id, payload, created_at")
      .eq("organization_id", organizationId)
      .in("id", linkedIds);
    if (linkedErr) throw new Error(linkedErr.message);
    for (const row of linked ?? []) {
      if (!seen.has(row.id as string)) {
        rows.push(row);
        seen.add(row.id as string);
      }
    }
  }

  return rows.map(mapQuoteRow);
}

export async function fetchProjectReportBundle(
  filters: ProjectReportFilters,
): Promise<ProjectReportBundle | null> {
  const { organizationId, projectId, from, to } = filters;
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

  const [
    fuelRows,
    prodRows,
    drillRows,
    attRows,
    partsRows,
    tripRows,
    daRows,
    rentalRows,
    stockRows,
    materialRows,
    traitementRows,
  ] = await Promise.all([
    rowsForProject(supabase, organizationId, "admin_gasoil_bons", projectId, "bon_date"),
    rowsForProject(supabase, organizationId, "admin_production_entries", projectId, "entry_date"),
    rowsForProject(supabase, organizationId, "admin_drilling_reports", projectId, "report_date"),
    rowsForProject(supabase, organizationId, "admin_attendance", projectId, "record_date"),
    rowsForProject(supabase, organizationId, "admin_parts_usage", projectId, "usage_date"),
    rowsForProject(supabase, organizationId, "admin_trips", projectId, "trip_date"),
    rowsForProject(supabase, organizationId, "admin_purchase_requests", projectId, "created_at"),
    rowsForProject(supabase, organizationId, "admin_rental_contracts", projectId, "created_at"),
    rowsForProject(supabase, organizationId, "admin_stock_movements", projectId, "movement_date"),
    rowsForProject(supabase, organizationId, "admin_rental_materials", projectId, "created_at"),
    rowsForProject(supabase, organizationId, "admin_traitements", projectId, "created_at"),
  ]);

  const quoteDrafts = await loadProjectQuotes(supabase, organizationId, projectId, traitementRows);

  const allBons = fuelRows.map(mapGasoilBonRow);
  const filteredBons = allBons.filter((b) => dateInRange(b.bonDate, from, to));
  const sorties = filteredBons
    .filter((b) => b.bonType === "sortie")
    .map((b) => mapBonToFuelEntry(fuelRows.find((r) => r.id === b.id) ?? {}));
  const commandes = filteredBons.filter((b) => b.bonType === "achat");

  const gasoilCost = sumGasoilCost([...commandes, ...filteredBons.filter((b) => b.bonType === "sortie" && b.totalAmount > 0)]);

  const movements = stockRows
    .filter((r) => dateInRange(r.movement_date as string, from, to))
    .map(mapStockMovementRow);
  const stockTotals = computeStockTotals(movements);

  const contracts = rentalRows
    .filter((r) => dateInRange((r.line_date as string) || (r.created_at as string), from, to))
    .map(mapRentalContractRow);
  const rentalTotals = computeRentalTotals(contracts);

  const materials: RentalMaterialReport[] = materialRows.map((r) => {
    const m = mapRentalMaterialRow(r);
    return {
      id: m.id,
      reference: m.reference,
      designation: m.designation,
      ownerName: m.ownerName,
      supplierId: m.supplierId,
      dailyRate: m.dailyRate,
      vatRate: m.vatRate,
      contractStartDate: m.contractStartDate,
      contractEndDate: m.contractEndDate,
      projectId: m.projectId,
    };
  });

  const attendance = attRows
    .filter((r) => dateInRange(r.record_date as string, from, to))
    .map(mapAtt);

  const productionEntries = prodRows
    .filter((r) => dateInRange(r.entry_date as string, from, to))
    .map(mapProd);
  const drilling = drillRows
    .filter((r) => dateInRange(r.report_date as string, from, to))
    .map(mapDrill);
  const parts = partsRows.filter((r) => dateInRange(r.usage_date as string, from, to)).map(mapParts);
  const trips = tripRows.filter((r) => dateInRange(r.trip_date as string, from, to)).map(mapTrip);

  const purchaseRequests = daRows
    .filter((r) => dateInRange((r.created_at as string)?.slice(0, 10), from, to))
    .map(mapDa);

  const traitementIds = traitementRows.map((r) => r.id as string);
  let traitementLineRows: Record<string, unknown>[] = [];
  if (traitementIds.length > 0) {
    const { data: lines, error: linesErr } = await supabase
      .from("admin_traitement_lines")
      .select("*")
      .in("traitement_id", traitementIds)
      .order("sort_order", { ascending: true });
    if (linesErr) throw new Error(linesErr.message);
    traitementLineRows = (lines ?? []) as Record<string, unknown>[];
  }

  const linesByTraitement = new Map<string, ReturnType<typeof mapTraitementLine>[]>();
  for (const line of traitementLineRows) {
    const tid = line.traitement_id as string;
    const list = linesByTraitement.get(tid) ?? [];
    list.push(mapTraitementLine(line));
    linesByTraitement.set(tid, list);
  }

  const traitements = traitementRows
    .filter((r) => dateInRange((r.created_at as string)?.slice(0, 10), from, to))
    .map((r) => mapTraitementRow(r, linesByTraitement.get(r.id as string) ?? []));

  const documents = quoteDrafts.filter((q) => dateInRange(q.date, from, to));

  const traitementsAchat = traitements.filter((t) => t.traitementType === "achat");
  const traitementsVente = traitements.filter((t) => t.traitementType === "vente");
  const achatsHt = sumTraitementAchats(traitementsAchat);
  const ventesFromTraitements = sumTraitementVentes(traitementsVente);
  const facturationTotals = computeFacturationTotals(documents);
  const ventesHt = facturationTotals.ht + ventesFromTraitements;

  const partsCost = parts.reduce((a, r) => a + r.qty * r.unitPrice, 0);
  const daTotal = purchaseRequests.reduce((a, r) => a + r.totalAmount, 0);

  const profitability = computeProfitabilityLines({
    gasoilCost,
    rentalHt: rentalTotals.ht,
    partsCost,
    daTotal,
    achatsHt,
    ventesHt,
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      filters,
      project,
      template,
      periodLabel: periodLabel(from, to),
    },
    gasoil: {
      sorties,
      commandes,
      totals: {
        litresSortie: sumGasoilSortieLitres(sorties),
        litresAchat: commandes.reduce((a, b) => a + b.litres, 0),
        costMad: gasoilCost,
        bonCount: filteredBons.length,
      },
    },
    stock: {
      movements,
      totals: stockTotals,
    },
    rentals: {
      contracts,
      materials,
      totals: { ...rentalTotals, entryCount: contracts.length },
    },
    personnel: {
      attendance,
      totals: {
        present: attendance.filter((r) => r.status === "present").length,
        absent: attendance.filter((r) => r.status !== "present").length,
        overtimeHours: attendance.reduce((a, r) => a + r.overtimeHours, 0),
        entryCount: attendance.length,
      },
    },
    production: {
      entries: productionEntries,
      drilling,
      trips,
      parts,
      totals: {
        tonnage: productionEntries.reduce((a, r) => a + r.tonnage, 0),
        targetTonnage: productionEntries.reduce((a, r) => a + r.targetTonnage, 0),
        meters: drilling.reduce((a, r) => a + r.metersDrilled, 0),
        totalKm: trips.reduce((a, r) => a + r.distanceKm, 0),
        partsCost,
        entryCount: productionEntries.length + drilling.length,
      },
    },
    purchases: {
      requests: purchaseRequests,
      traitements: traitementsAchat,
      totals: {
        daTotal,
        achatsHt,
        pendingCount: purchaseRequests.filter((r) => r.status === "pending").length,
        entryCount: purchaseRequests.length + traitementsAchat.length,
      },
    },
    facturation: {
      documents,
      traitementsVente,
      totals: {
        ht: ventesHt,
        tva: facturationTotals.vat,
        ttc: facturationTotals.ttc,
        entryCount: documents.length + traitementsVente.length,
      },
    },
    profitability,
  };
}

export function bundleToProjectSummary(bundle: ProjectReportBundle) {
  const recentLimit = 8;
  return {
    project: bundle.meta.project,
    fuel: {
      totalLitres: bundle.gasoil.totals.litresSortie,
      entryCount: bundle.gasoil.totals.bonCount,
      recent: bundle.gasoil.sorties.slice(0, recentLimit),
    },
    production: {
      totalTonnage: bundle.production.totals.tonnage,
      targetTonnage: bundle.production.totals.targetTonnage,
      entryCount: bundle.production.entries.length,
      recent: bundle.production.entries.slice(0, recentLimit),
    },
    drilling: {
      totalMeters: bundle.production.totals.meters,
      entryCount: bundle.production.drilling.length,
      recent: bundle.production.drilling.slice(0, recentLimit),
    },
    attendance: {
      presentCount: bundle.personnel.totals.present,
      entryCount: bundle.personnel.totals.entryCount,
      recent: bundle.personnel.attendance.slice(0, recentLimit),
    },
    parts: {
      totalCost: bundle.production.totals.partsCost,
      entryCount: bundle.production.parts.length,
      recent: bundle.production.parts.slice(0, recentLimit),
    },
    trips: {
      totalKm: bundle.production.totals.totalKm,
      entryCount: bundle.production.trips.length,
      recent: bundle.production.trips.slice(0, recentLimit),
    },
    purchaseRequests: {
      pendingCount: bundle.purchases.totals.pendingCount,
      totalAmount: bundle.purchases.totals.daTotal,
      entryCount: bundle.purchases.requests.length,
      recent: bundle.purchases.requests.slice(0, recentLimit),
    },
    rentals: {
      totalMad: bundle.rentals.totals.ht,
      entryCount: bundle.rentals.totals.entryCount,
      recent: bundle.rentals.contracts.slice(0, recentLimit),
    },
    stock: {
      movementCount: bundle.stock.totals.movementCount,
      recent: bundle.stock.movements.slice(0, recentLimit),
    },
    reportTotals: {
      facturationHt: bundle.facturation.totals.ht,
      profitability: bundle.profitability.totals,
    },
  };
}

export { traitementLinesTotal };
