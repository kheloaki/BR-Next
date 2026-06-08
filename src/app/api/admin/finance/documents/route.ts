import { NextResponse } from "next/server";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import { assertFinanceManage } from "@/lib/admin/finance-permissions";
import {
  DOCUMENT_SELECT,
  computePaymentStatus,
  mapFinanceDocument,
  newFinanceId,
  refreshFinanceDocumentTotals,
} from "@/lib/admin/finance-server";
import type { FinanceDocumentType } from "@/lib/admin/finance-types";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { roundMoney } from "@/lib/admin/price-ht-ttc";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const documentType = searchParams.get("type");
  const customerId = searchParams.get("customerId");
  const supplierId = searchParams.get("supplierId");
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");

  let query = getSupabaseAdminClient()
    .from("admin_finance_documents")
    .select(DOCUMENT_SELECT)
    .eq("organization_id", auth.organizationId)
    .order("issue_date", { ascending: false });

  if (documentType) query = query.eq("document_type", documentType);
  if (customerId) query = query.eq("customer_id", customerId);
  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (projectId) query = query.eq("project_id", projectId);
  if (status) query = query.eq("payment_status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => mapFinanceDocument(row as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as {
    action?: "register_quote" | "create";
    quoteId?: string;
    documentType?: FinanceDocumentType;
    documentNumber?: string;
    customerId?: string | null;
    supplierId?: string | null;
    projectId?: string | null;
    issueDate?: string;
    dueDate?: string | null;
    amountHt?: number;
    amountTtc?: number;
    notes?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
  };

  const supabase = getSupabaseAdminClient();

  if (body.action === "register_quote" && body.quoteId) {
    const { data: quoteRow } = await supabase
      .from("admin_quotes")
      .select("id, payload, document_type, project_id")
      .eq("id", body.quoteId)
      .eq("organization_id", auth.organizationId)
      .maybeSingle();
    if (!quoteRow) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const payload = quoteRow.payload as QuoteDraft;
    const totals = computeQuoteTotals(payload);

    let customerId: string | null = null;
    if (payload.clientName?.trim()) {
      const { data: custMatch } = await supabase
        .from("admin_customers")
        .select("id")
        .eq("organization_id", auth.organizationId)
        .ilike("name", payload.clientName.trim())
        .limit(1)
        .maybeSingle();
      customerId = (custMatch?.id as string) ?? null;
    }

    const docType: FinanceDocumentType = "client_invoice";

    const { data: existing } = await supabase
      .from("admin_finance_documents")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .eq("source_type", "quote")
      .eq("source_id", body.quoteId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Document déjà enregistré en finance" }, { status: 409 });
    }

    const amountTtc = totals.ttc;
    const id = newFinanceId("fdoc");
    const { data, error } = await supabase
      .from("admin_finance_documents")
      .insert({
        id,
        organization_id: auth.organizationId,
        user_id: auth.userId,
        document_type: docType,
        document_number: payload.quoteNumber || id,
        source_type: "quote",
        source_id: body.quoteId,
        customer_id: customerId,
        project_id: (quoteRow.project_id as string) || payload.projectId || null,
        issue_date: payload.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        due_date: payload.dueDate?.slice(0, 10) || null,
        amount_ht: totals.ht,
        amount_ttc: amountTtc,
        paid_amount: 0,
        remaining_amount: amountTtc,
        payment_status: computePaymentStatus(amountTtc, 0, payload.dueDate ?? null),
        notes: null,
      })
      .select(DOCUMENT_SELECT)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapFinanceDocument(data as Record<string, unknown>));
  }

  if (!body.documentType || body.amountTtc == null) {
    return NextResponse.json({ error: "Type et montant TTC requis" }, { status: 400 });
  }

  const amountTtc = roundMoney(body.amountTtc);
  const amountHt = roundMoney(body.amountHt ?? body.amountTtc);
  const id = newFinanceId("fdoc");
  const { data, error } = await supabase
    .from("admin_finance_documents")
    .insert({
      id,
      organization_id: auth.organizationId,
      user_id: auth.userId,
      document_type: body.documentType,
      document_number: body.documentNumber?.trim() || id,
      source_type: body.sourceType ?? null,
      source_id: body.sourceId ?? null,
      customer_id: body.customerId ?? null,
      supplier_id: body.supplierId ?? null,
      project_id: body.projectId ?? null,
      issue_date: body.issueDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      due_date: body.dueDate?.slice(0, 10) || null,
      amount_ht: amountHt,
      amount_ttc: amountTtc,
      paid_amount: 0,
      remaining_amount: amountTtc,
      payment_status: computePaymentStatus(amountTtc, 0, body.dueDate ?? null),
      notes: body.notes?.trim() || null,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapFinanceDocument(data as Record<string, unknown>));
}

export async function PATCH(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as { id?: string; dueDate?: string | null; notes?: string | null };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.dueDate !== undefined) payload.due_date = body.dueDate?.slice(0, 10) || null;
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  const { data, error } = await supabase
    .from("admin_finance_documents")
    .update(payload)
    .eq("id", body.id)
    .eq("organization_id", auth.organizationId)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await refreshFinanceDocumentTotals(body.id, auth.organizationId);

  const { data: refreshed } = await supabase
    .from("admin_finance_documents")
    .select(DOCUMENT_SELECT)
    .eq("id", body.id)
    .single();

  return NextResponse.json(mapFinanceDocument((refreshed ?? data) as Record<string, unknown>));
}
