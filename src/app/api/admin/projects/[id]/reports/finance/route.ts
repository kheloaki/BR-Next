import { NextResponse } from "next/server";
import { FINANCE_CASHFLOW_TYPES } from "@/lib/admin/finance-rules";
import { assertFinanceAccess } from "@/lib/admin/finance-permissions";
import {
  DOCUMENT_SELECT,
  MOVEMENT_SELECT,
  mapFinanceDocument,
  mapFinanceMovement,
} from "@/lib/admin/finance-server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { roundMoney } from "@/lib/admin/price-ht-ttc";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const supabase = getSupabaseAdminClient();

  let movQuery = supabase
    .from("admin_finance_movements")
    .select(MOVEMENT_SELECT)
    .eq("organization_id", auth.organizationId)
    .eq("project_id", projectId)
    .is("voided_at", null);
  if (from) movQuery = movQuery.gte("movement_date", from);
  if (to) movQuery = movQuery.lte("movement_date", to);

  const { data: movData } = await movQuery;
  const movements = (movData ?? []).map((r) => mapFinanceMovement(r as Record<string, unknown>));

  let docQuery = supabase
    .from("admin_finance_documents")
    .select(DOCUMENT_SELECT)
    .eq("organization_id", auth.organizationId)
    .eq("project_id", projectId);
  if (from) docQuery = docQuery.gte("issue_date", from);
  if (to) docQuery = docQuery.lte("issue_date", to);

  const { data: docData } = await docQuery;
  const documents = (docData ?? []).map((r) => mapFinanceDocument(r as Record<string, unknown>));

  const clientInvoices = documents.filter((d) => d.documentType === "client_invoice");
  const supplierInvoices = documents.filter((d) => d.documentType === "supplier_invoice");

  const actualRevenueHt = roundMoney(clientInvoices.reduce((s, d) => s + d.amountHt, 0));
  const actualRevenueTtc = roundMoney(clientInvoices.reduce((s, d) => s + d.amountTtc, 0));
  const paidRevenue = roundMoney(clientInvoices.reduce((s, d) => s + d.paidAmount, 0));
  const unpaidClient = roundMoney(clientInvoices.reduce((s, d) => s + d.remainingAmount, 0));

  const committedCostsHt = roundMoney(supplierInvoices.reduce((s, d) => s + d.amountHt, 0));
  const paidCosts = roundMoney(supplierInvoices.reduce((s, d) => s + d.paidAmount, 0));
  const unpaidSupplier = roundMoney(supplierInvoices.reduce((s, d) => s + d.remainingAmount, 0));

  let cashIn = 0;
  let cashOut = 0;
  for (const m of movements) {
    if (!FINANCE_CASHFLOW_TYPES.includes(m.movementType)) continue;
    if (m.movementType === "income") cashIn += m.amount;
    if (m.movementType === "expense") cashOut += m.amount;
  }

  const cashMargin = roundMoney(cashIn - cashOut);
  const marginHt = roundMoney(actualRevenueHt - committedCostsHt);

  return NextResponse.json({
    projectId,
    period: { from: from || null, to: to || null },
    revenue: {
      actualRevenueHt,
      actualRevenueTtc,
      paidRevenue,
      unpaidClient,
    },
    costs: {
      committedCostsHt,
      paidCosts,
      unpaidSupplier,
      projectExpenses: roundMoney(
        movements.filter((m) => m.movementType === "expense").reduce((s, m) => s + m.amount, 0),
      ),
    },
    profitability: {
      marginHt,
      cashMargin,
      unpaidExposure: roundMoney(unpaidClient - unpaidSupplier),
    },
    cashflow: {
      encaissements: roundMoney(cashIn),
      decaissements: roundMoney(cashOut),
    },
    movements,
    documents,
  });
}
