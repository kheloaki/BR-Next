import { FINANCE_CASHFLOW_TYPES, signedMovementAmount } from "@/lib/admin/finance-rules";
import type {
  FinanceAccount,
  FinanceAccountType,
  FinanceAllocation,
  FinanceCaisseClosing,
  FinanceCategory,
  FinanceCategoryDirection,
  FinanceDocument,
  FinanceDocumentType,
  FinanceMovement,
  FinanceMovementType,
  FinancePaymentMethod,
  FinancePaymentStatus,
  FinanceAllocationTargetType,
} from "@/lib/admin/finance-types";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export function mapFinanceAccount(row: Record<string, unknown>, balance?: number): FinanceAccount {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    code: (row.code as string) || "",
    accountType: row.account_type as FinanceAccountType,
    currency: (row.currency as string) || "MAD",
    openingBalance: Number(row.opening_balance) || 0,
    isActive: Boolean(row.is_active),
    isDefault: Boolean(row.is_default),
    bankName: (row.bank_name as string) || null,
    rib: (row.rib as string) || null,
    iban: (row.iban as string) || null,
    balance,
    createdAt: row.created_at as string,
  };
}

export function mapFinanceCategory(row: Record<string, unknown>): FinanceCategory {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    name: row.name as string,
    slug: row.slug as string,
    direction: row.direction as FinanceCategoryDirection,
    isSystem: Boolean(row.is_system),
    parentId: (row.parent_id as string) || null,
  };
}

export function mapFinanceMovement(row: Record<string, unknown>): FinanceMovement {
  const account = row.admin_finance_accounts as { name?: string } | null;
  const category = row.admin_finance_categories as { name?: string } | null;
  const project = row.admin_projects as { name?: string } | null;
  const customer = row.admin_customers as { name?: string } | null;
  const supplier = row.admin_suppliers as { name?: string } | null;
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    accountId: row.account_id as string,
    accountName: account?.name,
    categoryId: row.category_id as string,
    categoryName: category?.name,
    movementType: row.movement_type as FinanceMovementType,
    amount: Number(row.amount) || 0,
    movementDate: row.movement_date as string,
    reference: row.reference as string,
    paymentMethod: (row.payment_method as FinancePaymentMethod) || null,
    projectId: (row.project_id as string) || null,
    projectName: project?.name ?? null,
    customerId: (row.customer_id as string) || null,
    customerName: customer?.name ?? null,
    supplierId: (row.supplier_id as string) || null,
    supplierName: supplier?.name ?? null,
    chequeNumber: (row.cheque_number as string) || null,
    virementRef: (row.virement_ref as string) || null,
    effectRef: (row.effect_ref as string) || null,
    transferGroupId: (row.transfer_group_id as string) || null,
    createdBy: row.created_by as string,
    notes: (row.notes as string) || null,
    receiptUrl: (row.receipt_url as string) || null,
    amountHt: row.amount_ht != null ? Number(row.amount_ht) : null,
    vatAmount: row.vat_amount != null ? Number(row.vat_amount) : null,
    isReconciled: Boolean(row.is_reconciled),
    voidedAt: (row.voided_at as string) || null,
    voidedBy: (row.voided_by as string) || null,
    voidReason: (row.void_reason as string) || null,
    createdAt: row.created_at as string,
  };
}

export function mapFinanceDocument(row: Record<string, unknown>): FinanceDocument {
  const customer = row.admin_customers as { name?: string } | null;
  const supplier = row.admin_suppliers as { name?: string } | null;
  const project = row.admin_projects as { name?: string } | null;
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    documentType: row.document_type as FinanceDocumentType,
    documentNumber: (row.document_number as string) || "",
    sourceType: (row.source_type as string) || null,
    sourceId: (row.source_id as string) || null,
    customerId: (row.customer_id as string) || null,
    customerName: customer?.name ?? null,
    supplierId: (row.supplier_id as string) || null,
    supplierName: supplier?.name ?? null,
    projectId: (row.project_id as string) || null,
    projectName: project?.name ?? null,
    issueDate: row.issue_date as string,
    dueDate: (row.due_date as string) || null,
    amountHt: Number(row.amount_ht) || 0,
    amountTtc: Number(row.amount_ttc) || 0,
    currency: (row.currency as string) || "MAD",
    paidAmount: Number(row.paid_amount) || 0,
    remainingAmount: Number(row.remaining_amount) || 0,
    paymentStatus: row.payment_status as FinancePaymentStatus,
    notes: (row.notes as string) || null,
    createdAt: row.created_at as string,
  };
}

export function mapFinanceAllocation(row: Record<string, unknown>): FinanceAllocation {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    movementId: row.movement_id as string,
    targetType: row.target_type as FinanceAllocationTargetType,
    targetId: row.target_id as string,
    allocatedAmount: Number(row.allocated_amount) || 0,
    allocatedAt: row.allocated_at as string,
    notes: (row.notes as string) || null,
  };
}

export function mapFinanceClosing(row: Record<string, unknown>): FinanceCaisseClosing {
  const account = row.admin_finance_accounts as { name?: string } | null;
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    accountId: row.account_id as string,
    accountName: account?.name,
    closingDate: row.closing_date as string,
    openingBalance: Number(row.opening_balance) || 0,
    totalIncome: Number(row.total_income) || 0,
    totalExpense: Number(row.total_expense) || 0,
    theoreticalBalance: Number(row.theoretical_balance) || 0,
    countedBalance: Number(row.counted_balance) || 0,
    difference: Number(row.difference) || 0,
    closedBy: row.closed_by as string,
    signedAt: (row.signed_at as string) || null,
    notes: (row.notes as string) || null,
    createdAt: row.created_at as string,
  };
}

export function computeAccountBalance(
  openingBalance: number,
  movements: { movementType: FinanceMovementType; amount: number; voidedAt?: string | null }[],
): number {
  let balance = openingBalance;
  for (const m of movements) {
    if (m.voidedAt) continue;
    balance += signedMovementAmount(m.movementType, m.amount);
  }
  return roundMoney(balance);
}

export function computePaymentStatus(
  amountTtc: number,
  paidAmount: number,
  dueDate: string | null,
): FinancePaymentStatus {
  const remaining = roundMoney(Math.max(0, amountTtc - paidAmount));
  if (remaining <= 0) return "paid";
  if (paidAmount > 0) {
    if (dueDate && dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)) return "overdue";
    return "partial";
  }
  if (dueDate && dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10)) return "overdue";
  return "unpaid";
}

export async function ensureFinanceCategories(organizationId: string) {
  const supabase = getSupabaseAdminClient();
  const { count } = await supabase
    .from("admin_finance_categories")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if ((count ?? 0) > 0) return;

  const seeds = [
    ["client_payment", "Encaissement client", "income"],
    ["supplier_payment", "Paiement fournisseur", "expense"],
    ["gasoil", "Gasoil", "expense"],
    ["achat_pieces", "Achat pièces", "expense"],
    ["location_materiel", "Location matériel", "expense"],
    ["salaire", "Salaire", "expense"],
    ["transport", "Transport", "expense"],
    ["avance", "Avance", "both"],
    ["bank_fee", "Frais bancaires", "expense"],
    ["maintenance", "Maintenance", "expense"],
    ["sous_traitance", "Sous-traitance", "expense"],
    ["frais_chantier", "Frais chantier", "expense"],
    ["administration", "Administration", "expense"],
    ["taxes", "Taxes", "expense"],
    ["divers", "Divers", "both"],
  ] as const;

  await supabase.from("admin_finance_categories").insert(
    seeds.map(([slug, name, direction]) => ({
      id: opsId("fcat"),
      organization_id: organizationId,
      name,
      slug,
      direction,
      is_system: true,
    })),
  );
}

export async function loadAccountBalances(organizationId: string, accountIds?: string[]) {
  const supabase = getSupabaseAdminClient();
  let accountsQuery = supabase
    .from("admin_finance_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true);
  if (accountIds?.length) accountsQuery = accountsQuery.in("id", accountIds);

  const { data: accounts } = await accountsQuery;
  if (!accounts?.length) return new Map<string, number>();

  const ids = accounts.map((a) => a.id as string);
  const { data: movements } = await supabase
    .from("admin_finance_movements")
    .select("account_id, movement_type, amount, voided_at")
    .eq("organization_id", organizationId)
    .in("account_id", ids)
    .is("voided_at", null);

  const byAccount = new Map<string, { movementType: FinanceMovementType; amount: number }[]>();
  for (const m of movements ?? []) {
    const list = byAccount.get(m.account_id as string) ?? [];
    list.push({ movementType: m.movement_type as FinanceMovementType, amount: Number(m.amount) });
    byAccount.set(m.account_id as string, list);
  }

  const balances = new Map<string, number>();
  for (const a of accounts) {
    const opening = Number(a.opening_balance) || 0;
    balances.set(a.id as string, computeAccountBalance(opening, byAccount.get(a.id as string) ?? []));
  }
  return balances;
}

export async function refreshFinanceDocumentTotals(documentId: string, organizationId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: doc } = await supabase
    .from("admin_finance_documents")
    .select("*")
    .eq("id", documentId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!doc) return;

  const { data: allocations } = await supabase
    .from("admin_finance_payment_allocations")
    .select("allocated_amount")
    .eq("target_type", "finance_document")
    .eq("target_id", documentId);

  const paidAmount = roundMoney((allocations ?? []).reduce((s, a) => s + Number(a.allocated_amount), 0));
  const amountTtc = Number(doc.amount_ttc) || 0;
  const remainingAmount = roundMoney(Math.max(0, amountTtc - paidAmount));
  const paymentStatus = computePaymentStatus(amountTtc, paidAmount, doc.due_date as string | null);

  await supabase
    .from("admin_finance_documents")
    .update({
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);
}

export function sumMovementsByType(
  movements: FinanceMovement[],
  types: FinanceMovementType[] = FINANCE_CASHFLOW_TYPES,
) {
  let income = 0;
  let expense = 0;
  for (const m of movements) {
    if (m.voidedAt || !types.includes(m.movementType)) continue;
    if (m.movementType === "income") income += m.amount;
    else if (m.movementType === "expense") expense += m.amount;
    else if (m.movementType === "adjustment") {
      if (m.amount >= 0) income += m.amount;
      else expense += Math.abs(m.amount);
    }
  }
  return { income: roundMoney(income), expense: roundMoney(expense) };
}

export function newFinanceId(prefix = "fin") {
  return opsId(prefix);
}

export const MOVEMENT_SELECT = `
  *,
  admin_finance_accounts(name),
  admin_finance_categories(name),
  admin_projects(name),
  admin_customers(name),
  admin_suppliers(name)
`;

export const DOCUMENT_SELECT = `
  *,
  admin_customers(name),
  admin_suppliers(name),
  admin_projects(name)
`;
