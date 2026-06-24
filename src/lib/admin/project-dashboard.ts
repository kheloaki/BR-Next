import type {
  ProjectDashboard,
  ProjectDashboardExpense,
  ProjectDashboardMaterial,
  ProjectDashboardPayment,
  ProjectFinancialSummary,
  ProjectLaborEntry,
} from "@/components/admin/operations-types";
import { FINANCE_CASHFLOW_TYPES } from "@/lib/admin/finance-rules";
import { DOCUMENT_SELECT, MOVEMENT_SELECT, mapFinanceDocument, mapFinanceMovement } from "@/lib/admin/finance-server";
import { GASOIL_STOCK_CATEGORY, isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { mapAdminProjectRow } from "@/lib/admin/map-project";
import { mapRentalMaterialRow } from "@/lib/admin/map-rental-material-catalog";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import {
  buildTransportDepartCharges,
  collectFirstEnginUsageByMaterial,
} from "@/lib/admin/rental-transport";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

export function computeResteARecevoir(budgetMad: number, montantPaye: number): number {
  return roundMoney(Math.max(0, budgetMad - montantPaye));
}

export function computeCostBreakdown(materials: number, labor: number, other: number) {
  return {
    materials: roundMoney(materials),
    labor: roundMoney(labor),
    other: roundMoney(other),
  };
}

export function computeTotalCostMad(breakdown: { materials: number; labor: number; other: number }): number {
  return roundMoney(breakdown.materials + breakdown.labor + breakdown.other);
}

type CostEvent = { date: string; amount: number };

export function buildCumulativeCostSeries(events: CostEvent[]): { date: string; total: number }[] {
  const byDate = new Map<string, number>();
  for (const e of events) {
    const d = e.date.slice(0, 10);
    if (!d) continue;
    byDate.set(d, (byDate.get(d) ?? 0) + e.amount);
  }
  const dates = [...byDate.keys()].sort();
  let running = 0;
  return dates.map((date) => {
    running = roundMoney(running + (byDate.get(date) ?? 0));
    return { date, total: running };
  });
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  bank: "Banque",
  cheque: "Chèque",
  transfer: "Virement bancaire",
  effect: "Effet",
};

function mapLaborRow(r: Record<string, unknown>): ProjectLaborEntry {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    employeeId: (r.employee_id as string) || null,
    employeeName: (r.employee_name as string) || "",
    workDate: r.work_date as string,
    daysWorked: Number(r.days_worked ?? 0),
    dailyRate: Number(r.daily_rate ?? 0),
    amount: Number(r.amount ?? 0),
    notes: (r.notes as string) || "",
  };
}

function formatPaymentMethod(method: string | null | undefined, movement: {
  chequeNumber?: string | null;
  virementRef?: string | null;
  effectRef?: string | null;
  reference?: string;
}): string {
  const base = PAYMENT_METHOD_LABELS[method ?? ""] ?? method ?? "—";
  if (method === "cheque" && movement.chequeNumber) return `${base} · ${movement.chequeNumber}`;
  if (method === "transfer" && movement.virementRef) return `${base} · ${movement.virementRef}`;
  if (method === "effect" && movement.effectRef) return `${base} · ${movement.effectRef}`;
  if (movement.reference?.trim()) return `${base} · ${movement.reference.trim()}`;
  return base;
}

export function computeProjectPaymentKpis(
  budgetMad: number,
  clientInvoices: { paidAmount: number; remainingAmount: number }[],
  incomeMovements: { id: string; amount: number }[],
  allocatedMovementIds: Set<string>,
): { montantPaye: number; resteARecevoir: number } {
  const invoicePaid = roundMoney(clientInvoices.reduce((s, d) => s + d.paidAmount, 0));
  const acomptes = roundMoney(
    incomeMovements
      .filter((m) => !allocatedMovementIds.has(m.id))
      .reduce((s, m) => s + m.amount, 0),
  );
  const montantPaye = roundMoney(invoicePaid + acomptes);

  const invoiceRemaining = roundMoney(clientInvoices.reduce((s, d) => s + d.remainingAmount, 0));
  const resteARecevoir =
    clientInvoices.length > 0
      ? invoiceRemaining
      : budgetMad > 0
        ? computeResteARecevoir(budgetMad, montantPaye)
        : 0;

  return { montantPaye, resteARecevoir };
}

async function loadProjectFinanceContext(
  supabase: Supabase,
  organizationId: string,
  projectIds: string[],
) {
  const { data: docs } = await supabase
    .from("admin_finance_documents")
    .select("id, project_id, paid_amount, remaining_amount, document_type")
    .eq("organization_id", organizationId)
    .in("project_id", projectIds)
    .eq("document_type", "client_invoice");

  const docIds = (docs ?? []).map((d) => d.id as string);
  let allocatedMovementIds = new Set<string>();

  if (docIds.length > 0) {
    const { data: allocations } = await supabase
      .from("admin_finance_payment_allocations")
      .select("movement_id")
      .eq("organization_id", organizationId)
      .eq("target_type", "finance_document")
      .in("target_id", docIds);
    allocatedMovementIds = new Set((allocations ?? []).map((a) => a.movement_id as string));
  }

  const { data: movements } = await supabase
    .from("admin_finance_movements")
    .select("id, project_id, movement_type, amount")
    .eq("organization_id", organizationId)
    .in("project_id", projectIds)
    .is("voided_at", null)
    .eq("movement_type", "income");

  return { docs: docs ?? [], movements: movements ?? [], allocatedMovementIds };
}

export async function fetchProjectFinancialSummaries(
  supabase: Supabase,
  organizationId: string,
  projectIds: string[],
): Promise<ProjectFinancialSummary[]> {
  if (projectIds.length === 0) return [];

  const { data: projects } = await supabase
    .from("admin_projects")
    .select("id, budget_mad")
    .eq("organization_id", organizationId)
    .in("id", projectIds);

  const budgetById = new Map(
    (projects ?? []).map((p) => [p.id as string, Number(p.budget_mad ?? 0)]),
  );

  const [financeCtx, partsRes, stockRes, laborRes, expenseRes] = await Promise.all([
    loadProjectFinanceContext(supabase, organizationId, projectIds),
    supabase
      .from("admin_parts_usage")
      .select("project_id, qty, unit_price")
      .eq("organization_id", organizationId)
      .in("project_id", projectIds),
    supabase
      .from("admin_stock_movements")
      .select("project_id, qty, unit_price, category, reference, designation, movement_type")
      .eq("organization_id", organizationId)
      .in("project_id", projectIds)
      .eq("movement_type", "exit"),
    supabase
      .from("admin_project_labor_entries")
      .select("project_id, amount")
      .eq("organization_id", organizationId)
      .in("project_id", projectIds),
    supabase
      .from("admin_finance_movements")
      .select("project_id, amount")
      .eq("organization_id", organizationId)
      .in("project_id", projectIds)
      .eq("movement_type", "expense")
      .is("voided_at", null),
  ]);

  const { docs, movements, allocatedMovementIds } = financeCtx;

  const materialsByProject = new Map<string, number>();
  for (const r of partsRes.data ?? []) {
    const pid = r.project_id as string;
    const amt = roundMoney(Number(r.qty ?? 0) * Number(r.unit_price ?? 0));
    materialsByProject.set(pid, roundMoney((materialsByProject.get(pid) ?? 0) + amt));
  }
  for (const r of stockRes.data ?? []) {
    const row = r as Record<string, unknown>;
    if (isGasoilStockItem(row as { category?: string; reference?: string; designation?: string })) {
      continue;
    }
    if ((row.category as string) === GASOIL_STOCK_CATEGORY) continue;
    const pid = row.project_id as string;
    const amt = roundMoney(Number(row.qty ?? 0) * Number(row.unit_price ?? 0));
    materialsByProject.set(pid, roundMoney((materialsByProject.get(pid) ?? 0) + amt));
  }

  const laborByProject = new Map<string, number>();
  for (const r of laborRes.data ?? []) {
    const pid = r.project_id as string;
    laborByProject.set(pid, roundMoney((laborByProject.get(pid) ?? 0) + Number(r.amount ?? 0)));
  }

  const expensesByProject = new Map<string, number>();
  for (const r of expenseRes.data ?? []) {
    const pid = r.project_id as string;
    expensesByProject.set(pid, roundMoney((expensesByProject.get(pid) ?? 0) + Number(r.amount ?? 0)));
  }

  return projectIds.map((projectId) => {
    const budgetMad = budgetById.get(projectId) ?? 0;
    const clientInvoices = docs
      .filter((d) => d.project_id === projectId)
      .map((d) => ({
        paidAmount: Number(d.paid_amount ?? 0),
        remainingAmount: Number(d.remaining_amount ?? 0),
      }));
    const incomeMovements = movements
      .filter((m) => m.project_id === projectId)
      .map((m) => ({ id: m.id as string, amount: Number(m.amount ?? 0) }));

    const { montantPaye, resteARecevoir } = computeProjectPaymentKpis(
      budgetMad,
      clientInvoices,
      incomeMovements,
      allocatedMovementIds,
    );

    const materials = materialsByProject.get(projectId) ?? 0;
    const labor = laborByProject.get(projectId) ?? 0;
    const other = expensesByProject.get(projectId) ?? 0;
    const totalCostMad = computeTotalCostMad(computeCostBreakdown(materials, labor, other));
    const margeMad = roundMoney(montantPaye - totalCostMad);

    return {
      projectId,
      budgetMad,
      montantPaye,
      resteARecevoir,
      totalCostMad,
      margeMad,
    };
  });
}

export async function fetchProjectDashboard(
  supabase: Supabase,
  organizationId: string,
  projectId: string,
): Promise<ProjectDashboard | null> {
  const { data: projectRow, error: projectErr } = await supabase
    .from("admin_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr) throw new Error(projectErr.message);
  if (!projectRow) return null;

  const project = mapAdminProjectRow(projectRow as Record<string, unknown>);
  const budgetMad = project.budgetMad;

  const [partsRes, stockRes, laborRes, movRes, docsRes, financeCtx, rentalRes, materialRes] = await Promise.all([
    supabase
      .from("admin_parts_usage")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .order("usage_date", { ascending: false }),
    supabase
      .from("admin_stock_movements")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .eq("movement_type", "exit")
      .order("movement_date", { ascending: false }),
    supabase
      .from("admin_project_labor_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .order("work_date", { ascending: false }),
    supabase
      .from("admin_finance_movements")
      .select(MOVEMENT_SELECT)
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .is("voided_at", null)
      .order("movement_date", { ascending: false }),
    supabase
      .from("admin_finance_documents")
      .select(DOCUMENT_SELECT)
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .eq("document_type", "client_invoice")
      .order("issue_date", { ascending: false }),
    loadProjectFinanceContext(supabase, organizationId, [projectId]),
    supabase
      .from("admin_rental_contracts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase.from("admin_rental_materials").select("*").eq("organization_id", organizationId),
  ]);

  if (partsRes.error) throw new Error(partsRes.error.message);
  if (stockRes.error) throw new Error(stockRes.error.message);
  if (laborRes.error) throw new Error(laborRes.error.message);
  if (movRes.error) throw new Error(movRes.error.message);
  if (docsRes.error) throw new Error(docsRes.error.message);
  if (rentalRes.error) throw new Error(rentalRes.error.message);
  if (materialRes.error) throw new Error(materialRes.error.message);

  const clientInvoices = (docsRes.data ?? []).map((r) => mapFinanceDocument(r as Record<string, unknown>));

  const materials: ProjectDashboardMaterial[] = [];

  for (const r of partsRes.data ?? []) {
    const qty = Number(r.qty ?? 0);
    const unitPrice = Number(r.unit_price ?? 0);
    materials.push({
      id: r.id as string,
      source: "parts",
      date: r.usage_date as string,
      designation: (r.designation as string) || "—",
      reference: (r.reference as string) || "",
      location: project.name,
      qty,
      unit: "Pc",
      totalMad: roundMoney(qty * unitPrice),
    });
  }

  for (const r of stockRes.data ?? []) {
    const row = r as Record<string, unknown>;
    if (isGasoilStockItem(row as { category?: string; reference?: string; designation?: string })) {
      continue;
    }
    if ((row.category as string) === GASOIL_STOCK_CATEGORY) continue;
    const qty = Number(row.qty ?? 0);
    const unitPrice = Number(row.unit_price ?? 0);
    materials.push({
      id: row.id as string,
      source: "stock",
      date: row.movement_date as string,
      designation: (row.designation as string) || "—",
      reference: (row.reference as string) || "",
      location: (row.site_name as string) || project.name,
      qty,
      unit: (row.unit as string) || "u",
      totalMad: roundMoney(qty * unitPrice),
    });
  }

  const materialsById = new Map(
    (materialRes.data ?? []).map((r) => [r.id as string, mapRentalMaterialRow(r as Record<string, unknown>)]),
  );
  const firstUsage = collectFirstEnginUsageByMaterial(
    (rentalRes.data ?? []) as Record<string, unknown>[],
    projectId,
    materialsById,
  );
  for (const charge of buildTransportDepartCharges(firstUsage, materialsById)) {
    materials.push({
      id: `transport-${charge.materialId}`,
      source: "transport",
      date: charge.date,
      designation: `Transport départ — ${charge.designation}`,
      reference: charge.matricule,
      location: project.name,
      qty: 1,
      unit: "forfait",
      totalMad: charge.amountHt,
    });
  }

  materials.sort((a, b) => b.date.localeCompare(a.date));

  const labor = (laborRes.data ?? []).map((r) => mapLaborRow(r as Record<string, unknown>));

  const movements = (movRes.data ?? []).map((r) => mapFinanceMovement(r as Record<string, unknown>));

  const { montantPaye, resteARecevoir } = computeProjectPaymentKpis(
    budgetMad,
    clientInvoices.map((d) => ({ paidAmount: d.paidAmount, remainingAmount: d.remainingAmount })),
    movements
      .filter((m) => m.movementType === "income")
      .map((m) => ({ id: m.id, amount: m.amount })),
    financeCtx.allocatedMovementIds,
  );

  const payments: ProjectDashboardPayment[] = [];
  const expenses: ProjectDashboardExpense[] = [];

  for (const m of movements) {
    if (m.movementType === "income" && FINANCE_CASHFLOW_TYPES.includes(m.movementType)) {
      const isAcompte = !financeCtx.allocatedMovementIds.has(m.id);
      const refBase = m.reference || m.notes || "";
      payments.push({
        id: m.id,
        date: m.movementDate,
        paymentMethod: formatPaymentMethod(m.paymentMethod, m),
        reference: isAcompte && refBase ? `Acompte · ${refBase}` : isAcompte ? "Acompte chantier" : refBase,
        amount: m.amount,
      });
    }
    if (m.movementType === "expense") {
      expenses.push({
        id: m.id,
        date: m.movementDate,
        category: m.categoryName || "Dépense",
        amount: m.amount,
      });
    }
  }

  const materialsTotal = roundMoney(materials.reduce((s, m) => s + m.totalMad, 0));
  const laborTotal = roundMoney(labor.reduce((s, l) => s + l.amount, 0));
  const otherTotal = roundMoney(expenses.reduce((s, e) => s + e.amount, 0));
  const costBreakdown = computeCostBreakdown(materialsTotal, laborTotal, otherTotal);
  const totalCostMad = computeTotalCostMad(costBreakdown);

  const costEvents: CostEvent[] = [
    ...materials.map((m) => ({ date: m.date, amount: m.totalMad })),
    ...labor.map((l) => ({ date: l.workDate, amount: l.amount })),
    ...expenses.map((e) => ({ date: e.date, amount: e.amount })),
  ];
  const cumulativeCost = buildCumulativeCostSeries(costEvents);

  return {
    projectId,
    budgetMad,
    montantPaye,
    resteARecevoir,
    totalCostMad,
    materials,
    labor,
    payments,
    expenses,
    clientInvoices: clientInvoices.map((d) => ({
      id: d.id,
      documentNumber: d.documentNumber,
      amountHt: d.amountHt,
      amountTtc: d.amountTtc,
      paidAmount: d.paidAmount,
      remainingAmount: d.remainingAmount,
      paymentStatus: d.paymentStatus,
    })),
    costBreakdown,
    cumulativeCost,
  };
}

export function mapLaborPayload(body: Record<string, unknown>, projectId: string) {
  const daysWorked = Math.max(0, Number(body.daysWorked ?? body.days_worked ?? 1) || 0);
  const dailyRate = Math.max(0, Number(body.dailyRate ?? body.daily_rate ?? 0) || 0);
  const amount = roundMoney(daysWorked * dailyRate);
  return {
    project_id: projectId,
    employee_id: body.employeeId ? String(body.employeeId).trim() || null : null,
    employee_name: String(body.employeeName ?? body.employee_name ?? "").trim(),
    work_date: body.workDate ? String(body.workDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    days_worked: daysWorked,
    daily_rate: dailyRate,
    amount,
    notes: String(body.notes ?? "").trim(),
  };
}
