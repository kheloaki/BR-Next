import { NextResponse } from "next/server";
import { assertFinanceManage } from "@/lib/admin/finance-permissions";
import {
  DOCUMENT_SELECT,
  fetchFinanceDocumentDetail,
  mapFinanceDocument,
} from "@/lib/admin/finance-server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  try {
    const detail = await fetchFinanceDocumentDetail(supabase, auth.organizationId, id);
    if (!detail) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur chargement facture" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json()) as { dueDate?: string | null; notes?: string | null };

  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.dueDate !== undefined) payload.due_date = body.dueDate?.slice(0, 10) || null;
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

  const { data, error } = await supabase
    .from("admin_finance_documents")
    .update(payload)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select(DOCUMENT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapFinanceDocument(data as Record<string, unknown>));
}
