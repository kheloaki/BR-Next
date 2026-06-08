import type { QuoteDraft } from "@/components/admin/devis-types";
import type { DocumentType } from "@/components/admin/devis-types";
import { computeStockStatus } from "@/components/admin/operations-types";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import { computeRentalTotalMad } from "@/lib/admin/map-rental-material";
import { isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardRecentDocument = QuoteDraft & {
  dbCreatedAt: string;
  documentType: DocumentType;
};

export type DashboardStats = {
  commercial: {
    devisCount: number;
    bcCount: number;
    blCount: number;
    factureCount: number;
    clientsCount: number;
    suppliersCount: number;
    productsCount: number;
    monthDocsCount: number;
    monthTotalTtc: number;
    monthFacturesTtc: number;
    monthDevisTtc: number;
  };
  operations: {
    projectsCount: number;
    activeProjectsCount: number;
    stockItems: number;
    stockAlerts: number;
    pendingPurchaseRequests: number;
    fuelLitresMonth: number;
    fuelLitresTotal: number;
    productionTonnageMonth: number;
    productionTargetMonth: number;
    productionRate: number | null;
    drillingMetersMonth: number;
    tripsMonth: number;
    rentalBonsCount: number;
    rentalBonsMonth: number;
    rentalMadMonth: number;
    traitementsOpen: number;
    partsUsageQtyMonth: number;
    employeesCount: number;
  };
  recentDocuments: DashboardRecentDocument[];
};

function startOfMonthIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function mapQuoteRow(row: {
  id: string;
  payload: unknown;
  created_at: string;
  document_type?: string | null;
}): DashboardRecentDocument {
  const payload = (row.payload as QuoteDraft) ?? ({} as QuoteDraft);
  const documentType = (row.document_type ?? payload.documentType ?? "devis") as DocumentType;
  return {
    ...payload,
    id: row.id,
    documentType,
    createdAt: payload.createdAt ?? row.created_at,
    dbCreatedAt: row.created_at,
  };
}

function isThisMonth(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = getSupabaseAdminClient();
  const monthStart = startOfMonthIso();

  const [
    quotesRes,
    clientsRes,
    suppliersRes,
    productsRes,
    projectsRes,
    stockRes,
    pendingDaRes,
    fuelMonthRes,
    fuelTotalRes,
    drillRes,
    tripsRes,
    employeesRes,
    prodRes,
    partsRes,
    rentalsRes,
    traitementsRes,
  ] = await Promise.all([
    supabase
      .from("admin_quotes")
      .select("id, payload, created_at, document_type")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("admin_customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("admin_suppliers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("admin_products")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("admin_projects")
      .select("id, status")
      .eq("organization_id", organizationId),
    supabase
      .from("admin_stock_items")
      .select("qty, min_qty, category, reference, designation")
      .eq("organization_id", organizationId),
    supabase
      .from("admin_purchase_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending"),
    supabase
      .from("admin_gasoil_bons")
      .select("litres")
      .eq("organization_id", organizationId)
      .eq("bon_type", "sortie")
      .gte("bon_date", monthStart),
    supabase
      .from("admin_gasoil_bons")
      .select("litres")
      .eq("organization_id", organizationId)
      .eq("bon_type", "sortie"),
    supabase
      .from("admin_drilling_reports")
      .select("depth_start, depth_end")
      .eq("organization_id", organizationId)
      .gte("report_date", monthStart),
    supabase
      .from("admin_trips")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("trip_date", monthStart),
    supabase
      .from("admin_employees")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("admin_production_entries")
      .select("tonnage, target_tonnage")
      .eq("organization_id", organizationId)
      .gte("entry_date", monthStart),
    supabase
      .from("admin_parts_usage")
      .select("qty")
      .eq("organization_id", organizationId)
      .gte("usage_date", monthStart),
    supabase
      .from("admin_rental_contracts")
      .select("*")
      .eq("organization_id", organizationId),
    supabase
      .from("admin_traitements")
      .select("id, status")
      .eq("organization_id", organizationId)
      .in("status", ["open", "in_progress"]),
  ]);

  if (quotesRes.error) throw new Error(quotesRes.error.message);

  const quotes = (quotesRes.data ?? []).map(mapQuoteRow);

  let monthDocsCount = 0;
  let monthTotalTtc = 0;
  let monthFacturesTtc = 0;
  let monthDevisTtc = 0;

  for (const q of quotes) {
    const ttc = computeQuoteTotals(q).ttc;
    const created = q.dbCreatedAt ?? q.createdAt;
    if (isThisMonth(created)) {
      monthDocsCount += 1;
      monthTotalTtc += ttc;
      if (q.documentType === "facture") monthFacturesTtc += ttc;
      if (q.documentType === "devis") monthDevisTtc += ttc;
    }
  }

  const countByType = (type: DocumentType) => quotes.filter((q) => q.documentType === type).length;

  const projectRows = projectsRes.data ?? [];
  const activeProjectsCount = projectRows.filter((p) => p.status === "active").length;

  let stockItems = 0;
  let stockAlerts = 0;
  for (const row of stockRes.data ?? []) {
    if (isGasoilStockItem(row)) continue;
    stockItems += 1;
    const qty = Number(row.qty ?? 0);
    const minQty = Number(row.min_qty ?? 0);
    if (computeStockStatus(qty, minQty) !== "ok") stockAlerts += 1;
  }

  const prodRows = prodRes.data ?? [];
  const productionTonnageMonth = prodRows.reduce((a, r) => a + Number(r.tonnage ?? 0), 0);
  const productionTargetMonth = prodRows.reduce((a, r) => a + Number(r.target_tonnage ?? 0), 0);
  const productionRate =
    productionTargetMonth > 0 ? Math.round((productionTonnageMonth / productionTargetMonth) * 100) : null;

  const drillingMetersMonth = (drillRes.data ?? []).reduce(
    (acc, r) => acc + Math.max(0, Number(r.depth_end ?? 0) - Number(r.depth_start ?? 0)),
    0,
  );

  const rentalRowsAll = rentalsRes.data ?? [];
  const rentalRows = rentalRowsAll.filter((r) => {
    const d = String(r.line_date ?? "").slice(0, 10) || String(r.created_at ?? "").slice(0, 10);
    return d >= monthStart;
  });
  const rentalMadMonth = rentalRows.reduce((a, r) => a + computeRentalTotalMad(r), 0);

  return {
    commercial: {
      devisCount: countByType("devis"),
      bcCount: countByType("bon_commande"),
      blCount: countByType("bon_livraison"),
      factureCount: countByType("facture"),
      clientsCount: clientsRes.count ?? 0,
      suppliersCount: suppliersRes.count ?? 0,
      productsCount: productsRes.count ?? 0,
      monthDocsCount,
      monthTotalTtc,
      monthFacturesTtc,
      monthDevisTtc,
    },
    operations: {
      projectsCount: projectRows.length,
      activeProjectsCount,
      stockItems,
      stockAlerts,
      pendingPurchaseRequests: pendingDaRes.count ?? 0,
      fuelLitresMonth: (fuelMonthRes.data ?? []).reduce((a, r) => a + Number(r.litres ?? 0), 0),
      fuelLitresTotal: (fuelTotalRes.data ?? []).reduce((a, r) => a + Number(r.litres ?? 0), 0),
      productionTonnageMonth,
      productionTargetMonth,
      productionRate,
      drillingMetersMonth,
      tripsMonth: tripsRes.count ?? 0,
      rentalBonsCount: rentalRowsAll.length,
      rentalBonsMonth: rentalRows.length,
      rentalMadMonth,
      traitementsOpen: (traitementsRes.data ?? []).length,
      partsUsageQtyMonth: (partsRes.data ?? []).reduce((a, r) => a + Number(r.qty ?? 0), 0),
      employeesCount: employeesRes.count ?? 0,
    },
    recentDocuments: quotes.slice(0, 6),
  };
}

/** @deprecated Use getDashboardStats */
export async function getDashboardOpsStats(organizationId: string) {
  const s = await getDashboardStats(organizationId);
  return {
    stockItems: s.operations.stockItems,
    stockAlerts: s.operations.stockAlerts,
    pendingPurchaseRequests: s.operations.pendingPurchaseRequests,
    fuelLitresMonth: s.operations.fuelLitresMonth,
    drillingMetersMonth: s.operations.drillingMetersMonth,
    tripsMonth: s.operations.tripsMonth,
    activeEmployees: s.operations.employeesCount,
    productionRate: s.operations.productionRate ?? 0,
    partsUsageMonth: s.operations.partsUsageQtyMonth,
    rentalEquipment: s.operations.rentalBonsCount,
  };
}
