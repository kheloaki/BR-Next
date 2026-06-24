import type { QuoteDraft } from "@/components/admin/devis-types";
import { computeQuoteTotals, traitementLinesTotal } from "@/lib/admin/project-report-calculations";
import {
  DOCUMENT_SELECT,
  computePaymentStatus,
  mapFinanceDocument,
  newFinanceId,
  refreshFinanceDocumentTotals,
} from "@/lib/admin/finance-server";
import type { FinanceDocument, FinanceDocumentType } from "@/lib/admin/finance-types";
import { DEFAULT_VAT_RATE, htToTtc, roundMoney } from "@/lib/admin/price-ht-ttc";
import type { Traitement } from "@/lib/admin/traitement-types";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

export type TraitementFinanceSummary = {
  traitementId: string;
  document: FinanceDocument | null;
  traitementNumber: string;
  traitementType: Traitement["traitementType"];
};

export function traitementFinanceDocumentType(traitement: Traitement): FinanceDocumentType | null {
  if (traitement.steps.f?.status !== "done") return null;
  return traitement.traitementType === "vente" ? "client_invoice" : "supplier_invoice";
}

export function resolveTraitementInvoiceAmounts(
  traitement: Traitement,
  quote?: QuoteDraft | null,
): { amountHt: number; amountTtc: number; documentNumber: string; issueDate: string; dueDate: string | null } {
  const stepF = traitement.steps.f;
  if (quote) {
    const totals = computeQuoteTotals(quote);
    return {
      amountHt: totals.ht,
      amountTtc: totals.ttc,
      documentNumber: quote.quoteNumber?.trim() || stepF?.docNumber || traitement.number,
      issueDate: quote.date?.slice(0, 10) || stepF?.docDate || new Date().toISOString().slice(0, 10),
      dueDate: quote.dueDate?.slice(0, 10) || null,
    };
  }

  const amountHt = traitementLinesTotal(traitement.lines);
  const vatRate = DEFAULT_VAT_RATE;
  const amountTtc = htToTtc(amountHt, vatRate);
  return {
    amountHt,
    amountTtc,
    documentNumber: stepF?.docNumber?.trim() || traitement.number,
    issueDate: stepF?.docDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    dueDate: null,
  };
}

export async function upsertTraitementFinanceDocument(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitement: Traitement,
  quote?: QuoteDraft | null,
): Promise<FinanceDocument | null> {
  const documentType = traitementFinanceDocumentType(traitement);
  if (!documentType) return null;

  const stepF = traitement.steps.f!;

  const { amountHt, amountTtc, documentNumber, issueDate, dueDate } = resolveTraitementInvoiceAmounts(
    traitement,
    quote,
  );

  const { data: existing } = await supabase
    .from("admin_finance_documents")
    .select("id, paid_amount")
    .eq("organization_id", organizationId)
    .eq("source_type", "traitement")
    .eq("source_id", traitement.id)
    .maybeSingle();

  const paidAmount = existing ? roundMoney(Number(existing.paid_amount) || 0) : 0;
  const remainingAmount = roundMoney(Math.max(0, amountTtc - paidAmount));
  const paymentStatus = computePaymentStatus(amountTtc, paidAmount, dueDate);

  const row = {
    document_type: documentType,
    document_number: documentNumber,
    source_type: "traitement",
    source_id: traitement.id,
    customer_id: traitement.traitementType === "vente" ? traitement.customerId : null,
    supplier_id: traitement.traitementType === "achat" ? traitement.supplierId : null,
    project_id: traitement.projectId,
    issue_date: issueDate,
    due_date: dueDate,
    amount_ht: amountHt,
    amount_ttc: amountTtc,
    remaining_amount: remainingAmount,
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("admin_finance_documents")
      .update(row)
      .eq("id", existing.id)
      .eq("organization_id", organizationId)
      .select(DOCUMENT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    await refreshFinanceDocumentTotals(existing.id as string, organizationId);
    const { data: refreshed } = await supabase
      .from("admin_finance_documents")
      .select(DOCUMENT_SELECT)
      .eq("id", existing.id)
      .single();
    return mapFinanceDocument((refreshed ?? data) as Record<string, unknown>);
  }

  const id = newFinanceId("fdoc");
  const { data, error } = await supabase
    .from("admin_finance_documents")
    .insert({
      id,
      organization_id: organizationId,
      user_id: userId,
      ...row,
      paid_amount: 0,
      currency: "MAD",
      notes: null,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapFinanceDocument(data as Record<string, unknown>);
}

export async function attachTraitementFinanceSummaries(
  supabase: Supabase,
  organizationId: string,
  traitements: Traitement[],
  userId?: string,
): Promise<Traitement[]> {
  const eligible = traitements.filter((t) => traitementFinanceDocumentType(t));

  if (userId) {
    for (const traitement of eligible) {
      const { data: existing } = await supabase
        .from("admin_finance_documents")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("source_type", "traitement")
        .eq("source_id", traitement.id)
        .maybeSingle();
      if (!existing) {
        await syncTraitementFinanceFromStoredQuote(supabase, organizationId, userId, traitement);
      }
    }
  }

  const eligibleIds = eligible.map((t) => t.id);

  const docByTraitementId = new Map<string, FinanceDocument>();
  if (eligibleIds.length > 0) {
    const { data, error } = await supabase
      .from("admin_finance_documents")
      .select(DOCUMENT_SELECT)
      .eq("organization_id", organizationId)
      .eq("source_type", "traitement")
      .in("source_id", eligibleIds);

    if (error) throw new Error(error.message);

    for (const row of data ?? []) {
      const doc = mapFinanceDocument(row as Record<string, unknown>);
      if (doc.sourceId) docByTraitementId.set(doc.sourceId, doc);
    }
  }

  return traitements.map((traitement) => {
    if (traitement.steps.f?.status !== "done") {
      return { ...traitement, financeSummary: null };
    }

    const doc = docByTraitementId.get(traitement.id);
    if (!doc) {
      return { ...traitement, financeSummary: { pendingSync: true } as const };
    }

    return {
      ...traitement,
      financeSummary: {
        documentId: doc.id,
        documentNumber: doc.documentNumber,
        amountTtc: doc.amountTtc,
        paidAmount: doc.paidAmount,
        remainingAmount: doc.remainingAmount,
        paymentStatus: doc.paymentStatus,
      },
    };
  });
}

export async function getTraitementFinanceSummary(
  supabase: Supabase,
  organizationId: string,
  traitementId: string,
  traitementNumber: string,
  traitementType: Traitement["traitementType"],
): Promise<TraitementFinanceSummary> {
  const { data } = await supabase
    .from("admin_finance_documents")
    .select(DOCUMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("source_type", "traitement")
    .eq("source_id", traitementId)
    .maybeSingle();

  return {
    traitementId,
    traitementNumber,
    traitementType,
    document: data ? mapFinanceDocument(data as Record<string, unknown>) : null,
  };
}

export async function syncTraitementFinanceFromStoredQuote(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitement: Traitement,
): Promise<FinanceDocument | null> {
  const stepF = traitement.steps.f;
  if (!stepF || stepF.status !== "done" || !stepF.quoteId) {
    return upsertTraitementFinanceDocument(supabase, organizationId, userId, traitement, null);
  }

  const { data: quoteRow } = await supabase
    .from("admin_quotes")
    .select("payload")
    .eq("id", stepF.quoteId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const quote = quoteRow?.payload as QuoteDraft | undefined;
  return upsertTraitementFinanceDocument(supabase, organizationId, userId, traitement, quote ?? null);
}
