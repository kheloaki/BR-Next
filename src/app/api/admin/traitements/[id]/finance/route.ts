import { NextResponse } from "next/server";
import { assertFinanceAccess } from "@/lib/admin/finance-permissions";
import {
  getTraitementFinanceSummary,
  syncTraitementFinanceFromStoredQuote,
  traitementFinanceDocumentType,
} from "@/lib/admin/traitement-finance-sync";
import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function loadTraitement(supabase: ReturnType<typeof getSupabaseAdminClient>, organizationId: string, id: string) {
  const { data: row, error } = await supabase
    .from("admin_traitements")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: lineRows } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .eq("traitement_id", id)
    .order("sort_order");

  return mapTraitementRow(
    row as Record<string, unknown>,
    (lineRows ?? []).map((l) => mapTraitementLine(l as Record<string, unknown>)),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const traitement = await loadTraitement(supabase, auth.organizationId, id);
  if (!traitement) return NextResponse.json({ error: "Traitement introuvable" }, { status: 404 });

  let summary = await getTraitementFinanceSummary(
    supabase,
    auth.organizationId,
    id,
    traitement.number,
    traitement.traitementType,
  );

  if (!summary.document && traitementFinanceDocumentType(traitement)) {
    try {
      await syncTraitementFinanceFromStoredQuote(
        supabase,
        auth.organizationId,
        auth.userId,
        traitement,
      );
      summary = await getTraitementFinanceSummary(
        supabase,
        auth.organizationId,
        id,
        traitement.number,
        traitement.traitementType,
      );
    } catch {
      /* keep summary without document */
    }
  }

  return NextResponse.json(summary);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const { id } = await params;
  const supabase = getSupabaseAdminClient();
  const traitement = await loadTraitement(supabase, auth.organizationId, id);
  if (!traitement) return NextResponse.json({ error: "Traitement introuvable" }, { status: 404 });

  if (traitement.steps.f?.status !== "done") {
    return NextResponse.json({ error: "Étape facture non validée" }, { status: 400 });
  }

  try {
    const document = await syncTraitementFinanceFromStoredQuote(
      supabase,
      auth.organizationId,
      auth.userId,
      traitement,
    );
    const summary = await getTraitementFinanceSummary(
      supabase,
      auth.organizationId,
      id,
      traitement.number,
      traitement.traitementType,
    );
    return NextResponse.json({ ...summary, document });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Synchronisation finance impossible" },
      { status: 500 },
    );
  }
}
