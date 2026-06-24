import { FINANCE_CASHFLOW_TYPES, signedMovementAmount } from "@/lib/admin/finance-rules";
import type {
  FinanceAccount,
  FinanceAccountType,
  FinanceAllocation,
  FinanceCaisseClosing,
  FinanceCategory,
  FinanceCategoryDirection,
  FinanceDocument,
  FinanceDocumentDetail,
  FinanceDocumentPayment,
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

export type FinanceMovementInsertInput = {
  accountId: string;
  categoryId: string;
  movementType: FinanceMovementType;
  amount: number;
  movementDate: string;
  reference: string;
  paymentMethod?: FinancePaymentMethod | null;
  projectId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  chequeNumber?: string | null;
  virementRef?: string | null;
  effectRef?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  amountHt?: number | null;
  vatAmount?: number | null;
};

export type FinanceAllocationInput = {
  targetType: FinanceAllocationTargetType;
  targetId: string;
  allocatedAmount: number;
  notes?: string | null;
};

export async function insertFinanceAllocation(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  movementId: string,
  input: FinanceAllocationInput,
) {
  const { data: movement } = await supabase
    .from("admin_finance_movements")
    .select("amount, voided_at")
    .eq("id", movementId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!movement || movement.voided_at) {
    throw new Error("Mouvement introuvable");
  }

  const { data: existing } = await supabase
    .from("admin_finance_payment_allocations")
    .select("allocated_amount")
    .eq("movement_id", movementId);

  const already = (existing ?? []).reduce((s, r) => s + Number(r.allocated_amount), 0);
  if (already + input.allocatedAmount > Number(movement.amount) + 0.01) {
    throw new Error("Montant alloué supérieur au paiement");
  }

  const id = newFinanceId("falloc");
  const { data, error } = await supabase
    .from("admin_finance_payment_allocations")
    .insert({
      id,
      organization_id: organizationId,
      movement_id: movementId,
      target_type: input.targetType,
      target_id: input.targetId,
      allocated_amount: input.allocatedAmount,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  if (input.targetType === "finance_document") {
    await refreshFinanceDocumentTotals(input.targetId, organizationId);
  }

  return mapFinanceAllocation(data as Record<string, unknown>);
}

export async function recordFinancePaymentWithAllocation(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  userId: string,
  movement: FinanceMovementInsertInput,
  allocation?: FinanceAllocationInput,
): Promise<FinanceMovement> {
  const id = newFinanceId("fmov");
  const { data, error } = await supabase
    .from("admin_finance_movements")
    .insert({
      id,
      organization_id: organizationId,
      account_id: movement.accountId,
      category_id: movement.categoryId,
      movement_type: movement.movementType,
      amount: movement.amount,
      movement_date: movement.movementDate.slice(0, 10),
      reference: movement.reference.trim(),
      payment_method: movement.paymentMethod ?? null,
      project_id: movement.projectId?.trim() || null,
      customer_id: movement.customerId?.trim() || null,
      supplier_id: movement.supplierId?.trim() || null,
      cheque_number: movement.chequeNumber?.trim() || null,
      virement_ref: movement.virementRef?.trim() || null,
      effect_ref: movement.effectRef?.trim() || null,
      created_by: userId,
      notes: movement.notes?.trim() || null,
      receipt_url: movement.receiptUrl?.trim() || null,
      amount_ht: movement.amountHt ?? null,
      vat_amount: movement.vatAmount ?? null,
    })
    .select(MOVEMENT_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Référence déjà utilisée");
    throw new Error(error.message);
  }

  const mapped = mapFinanceMovement(data as Record<string, unknown>);

  if (allocation) {
    await insertFinanceAllocation(supabase, organizationId, mapped.id, allocation);
  }

  return mapped;
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

export function buildFinanceSourceLabel(
  sourceType: string | null,
  traitementMeta?: { number: string; traitementType: "achat" | "vente" } | null,
): string {
  if (sourceType === "traitement" && traitementMeta) {
    const kind = traitementMeta.traitementType === "vente" ? "vente" : "achat";
    return `Traitement ${kind} ${traitementMeta.number}`;
  }
  if (sourceType === "quote") return "Facturation";
  if (sourceType === "traitement") return "Traitement";
  return "Manuel";
}

export async function enrichFinanceDocumentsWithSource(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  documents: FinanceDocument[],
): Promise<FinanceDocument[]> {
  const traitementIds = [
    ...new Set(
      documents
        .filter((d) => d.sourceType === "traitement" && d.sourceId)
        .map((d) => d.sourceId as string),
    ),
  ];

  const metaById = new Map<string, { number: string; traitementType: "achat" | "vente" }>();
  if (traitementIds.length > 0) {
    const { data } = await supabase
      .from("admin_traitements")
      .select("id, number, traitement_type")
      .eq("organization_id", organizationId)
      .in("id", traitementIds);

    for (const row of data ?? []) {
      metaById.set(row.id as string, {
        number: row.number as string,
        traitementType: row.traitement_type as "achat" | "vente",
      });
    }
  }

  return documents.map((d) => {
    const meta = d.sourceId ? metaById.get(d.sourceId) : undefined;
    return {
      ...d,
      sourceLabel: buildFinanceSourceLabel(d.sourceType, meta),
      sourceTraitementType: meta?.traitementType ?? null,
    };
  });
}

export async function fetchFinanceDocumentDetail(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  documentId: string,
): Promise<FinanceDocumentDetail | null> {
  const { data: docRow, error: docErr } = await supabase
    .from("admin_finance_documents")
    .select(DOCUMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", documentId)
    .maybeSingle();

  if (docErr) throw new Error(docErr.message);
  if (!docRow) return null;

  const baseDoc = mapFinanceDocument(docRow as Record<string, unknown>);
  const [document] = await enrichFinanceDocumentsWithSource(supabase, organizationId, [baseDoc]);

  const { data: allocationRows, error: allocErr } = await supabase
    .from("admin_finance_payment_allocations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("target_type", "finance_document")
    .eq("target_id", documentId)
    .order("allocated_at", { ascending: true });

  if (allocErr) throw new Error(allocErr.message);

  const movementIds = [...new Set((allocationRows ?? []).map((a) => a.movement_id as string))];
  const movementById = new Map<string, FinanceMovement>();

  if (movementIds.length > 0) {
    const { data: movementRows, error: movErr } = await supabase
      .from("admin_finance_movements")
      .select(MOVEMENT_SELECT)
      .eq("organization_id", organizationId)
      .in("id", movementIds);

    if (movErr) throw new Error(movErr.message);

    for (const row of movementRows ?? []) {
      movementById.set(row.id as string, mapFinanceMovement(row as Record<string, unknown>));
    }
  }

  const payments: FinanceDocumentPayment[] = [];
  for (const row of allocationRows ?? []) {
    const movement = movementById.get(row.movement_id as string);
    if (!movement || movement.voidedAt) continue;
    payments.push({
      ...movement,
      allocationId: row.id as string,
      allocatedAmount: Number(row.allocated_amount) || 0,
      allocatedAt: row.allocated_at as string,
      allocationNotes: (row.notes as string) || null,
    });
  }

  return { document, payments };
}
