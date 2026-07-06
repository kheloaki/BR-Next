import type { QuoteDraft } from "@/components/admin/devis-types";
import type { DocumentType } from "@/components/admin/devis-types";
import { computeStockStatus } from "@/components/admin/operations-types";
import { buildTresorerieReport } from "@/lib/admin/finance-reports";
import { FINANCE_CASHFLOW_TYPES } from "@/lib/admin/finance-rules";
import {
  loadAccountBalances,
  mapFinanceAccount,
  sumMovementsByType,
} from "@/lib/admin/finance-server";
import type { FinanceMovement, FinanceMovementType } from "@/lib/admin/finance-types";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import { computeRentalTotalMad } from "@/lib/admin/map-rental-material";
import { isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type DashboardRecentDocument = QuoteDraft & {
  dbCreatedAt: string;
  documentType: DocumentType;
};

export type DashboardWeekBucket = {
  label: string;
  docsCount: number;
  facturesTtc: number;
  devisTtc: number;
  totalTtc: number;
};

export type DashboardFinanceStats = {
  totalTreasury: number;
  totalCash: number;
  totalBank: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  clientReceivables: number;
  supplierPayables: number;
  overdueCount: number;
  openClientInvoices: number;
  accountCount: number;
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
    monthBcTtc: number;
    monthBlTtc: number;
  };
  operations: {
    projectsCount: number;
    activeProjectsCount: number;
    stockItems: number;
    stockAlerts: number;
    pendingPurchaseRequests: number;
    fuelLitresMonth: number;
    fuelLitresTotal: number;
    gasoilStockLitres: number;
    gasoilMinLitres: number;
    gasoilStockStatus: "ok" | "low" | "out";
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
  activity: {
    weeks: DashboardWeekBucket[];
  };
  finance: DashboardFinanceStats | null;
  attentionCount: number;
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

function buildMonthWeekBuckets(quotes: DashboardRecentDocument[]): DashboardWeekBucket[] {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ranges = [
    { label: "1–7", start: 1, end: 7 },
    { label: "8–14", start: 8, end: 14 },
    { label: "15–21", start: 15, end: 21 },
    { label: `22–${daysInMonth}`, start: 22, end: daysInMonth },
  ];

  const buckets: DashboardWeekBucket[] = ranges.map((r) => ({
    label: r.label,
    docsCount: 0,
    facturesTtc: 0,
    devisTtc: 0,
    totalTtc: 0,
  }));

  for (const q of quotes) {
    const created = q.dbCreatedAt ?? q.createdAt;
    if (!isThisMonth(created)) continue;
    const day = new Date(created).getDate();
    const idx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
    const ttc = computeQuoteTotals(q).ttc;
    buckets[idx]!.docsCount += 1;
    buckets[idx]!.totalTtc += ttc;
    if (q.documentType === "facture") buckets[idx]!.facturesTtc += ttc;
    if (q.documentType === "devis") buckets[idx]!.devisTtc += ttc;
  }

  return buckets;
}

async function loadDashboardFinanceStats(
  organizationId: string,
  monthStart: string,
): Promise<DashboardFinanceStats> {
  const supabase = getSupabaseAdminClient();

  const [accountsRes, movementsRes, docsRes] = await Promise.all([
    supabase
      .from("admin_finance_accounts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("admin_finance_movements")
      .select("movement_type, amount")
      .eq("organization_id", organizationId)
      .is("voided_at", null)
      .gte("movement_date", monthStart),
    supabase
      .from("admin_finance_documents")
      .select("document_type, remaining_amount, payment_status")
      .eq("organization_id", organizationId),
  ]);

  if (accountsRes.error) throw new Error(accountsRes.error.message);

  const balances = await loadAccountBalances(organizationId);
  const accounts = (accountsRes.data ?? []).map((a) =>
    mapFinanceAccount(a as Record<string, unknown>, balances.get(a.id as string)),
  );
  const tresorerie = buildTresorerieReport(accounts);

  const movements = (movementsRes.data ?? []).map((m) => ({
    movementType: m.movement_type as FinanceMovementType,
    amount: Number(m.amount ?? 0),
    voidedAt: null,
  })) as FinanceMovement[];

  const { income, expense } = sumMovementsByType(movements, FINANCE_CASHFLOW_TYPES);

  let clientReceivables = 0;
  let supplierPayables = 0;
  let overdueCount = 0;
  let openClientInvoices = 0;

  for (const d of docsRes.data ?? []) {
    const remaining = Number(d.remaining_amount ?? 0);
    const status = String(d.payment_status ?? "");
    const type = String(d.document_type ?? "");
    if (status === "overdue") overdueCount += 1;
    if (remaining <= 0) continue;
    if (type === "client_invoice" || type === "client_credit") {
      clientReceivables += remaining;
      if (status === "unpaid" || status === "partial" || status === "overdue") {
        openClientInvoices += 1;
      }
    }
    if (type === "supplier_invoice" || type === "supplier_credit") {
      supplierPayables += remaining;
    }
  }

  return {
    totalTreasury: tresorerie.total,
    totalCash: tresorerie.totalCash,
    totalBank: tresorerie.totalBank,
    monthIncome: income,
    monthExpense: expense,
    monthNet: roundMoney(income - expense),
    clientReceivables: roundMoney(clientReceivables),
    supplierPayables: roundMoney(supplierPayables),
    overdueCount,
    openClientInvoices,
    accountCount: accounts.length,
  };
}

export async function getDashboardStats(
  organizationId: string,
  options?: { includeFinance?: boolean },
): Promise<DashboardStats> {
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
  let monthBcTtc = 0;
  let monthBlTtc = 0;

  for (const q of quotes) {
    const ttc = computeQuoteTotals(q).ttc;
    const created = q.dbCreatedAt ?? q.createdAt;
    if (isThisMonth(created)) {
      monthDocsCount += 1;
      monthTotalTtc += ttc;
      if (q.documentType === "facture") monthFacturesTtc += ttc;
      if (q.documentType === "devis") monthDevisTtc += ttc;
      if (q.documentType === "bon_commande") monthBcTtc += ttc;
      if (q.documentType === "bon_livraison") monthBlTtc += ttc;
    }
  }

  const countByType = (type: DocumentType) => quotes.filter((q) => q.documentType === type).length;

  const projectRows = projectsRes.data ?? [];
  const activeProjectsCount = projectRows.filter((p) => p.status === "active").length;

  let stockItems = 0;
  let stockAlerts = 0;
  let gasoilStockLitres = 0;
  let gasoilMinLitres = 0;

  for (const row of stockRes.data ?? []) {
    if (isGasoilStockItem(row)) {
      gasoilStockLitres = Number(row.qty ?? 0);
      gasoilMinLitres = Number(row.min_qty ?? 0);
      continue;
    }
    stockItems += 1;
    const qty = Number(row.qty ?? 0);
    const minQty = Number(row.min_qty ?? 0);
    if (computeStockStatus(qty, minQty) !== "ok") stockAlerts += 1;
  }

  const gasoilStockStatus = computeStockStatus(gasoilStockLitres, gasoilMinLitres) as "ok" | "low" | "out";

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

  const traitementsOpen = (traitementsRes.data ?? []).length;
  const pendingPurchaseRequests = pendingDaRes.count ?? 0;
  const attentionCount =
    stockAlerts +
    pendingPurchaseRequests +
    traitementsOpen +
    (gasoilStockStatus !== "ok" ? 1 : 0);

  let finance: DashboardFinanceStats | null = null;
  if (options?.includeFinance) {
    try {
      finance = await loadDashboardFinanceStats(organizationId, monthStart);
    } catch {
      finance = null;
    }
  }

  const financeAttention = finance?.overdueCount ?? 0;

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
      monthBcTtc,
      monthBlTtc,
    },
    operations: {
      projectsCount: projectRows.length,
      activeProjectsCount,
      stockItems,
      stockAlerts,
      pendingPurchaseRequests,
      fuelLitresMonth: (fuelMonthRes.data ?? []).reduce((a, r) => a + Number(r.litres ?? 0), 0),
      fuelLitresTotal: (fuelTotalRes.data ?? []).reduce((a, r) => a + Number(r.litres ?? 0), 0),
      gasoilStockLitres,
      gasoilMinLitres,
      gasoilStockStatus,
      productionTonnageMonth,
      productionTargetMonth,
      productionRate,
      drillingMetersMonth,
      tripsMonth: tripsRes.count ?? 0,
      rentalBonsCount: rentalRowsAll.length,
      rentalBonsMonth: rentalRows.length,
      rentalMadMonth,
      traitementsOpen,
      partsUsageQtyMonth: (partsRes.data ?? []).reduce((a, r) => a + Number(r.qty ?? 0), 0),
      employeesCount: employeesRes.count ?? 0,
    },
    activity: {
      weeks: buildMonthWeekBuckets(quotes),
    },
    finance,
    attentionCount: attentionCount + financeAttention,
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
