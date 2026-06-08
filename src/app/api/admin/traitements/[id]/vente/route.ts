import { NextResponse } from "next/server";
import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import { createVenteTraitementFromAchat } from "@/lib/admin/traitement-achat-to-vente";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function loadTraitementWithLines(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  id: string,
  organizationId: string,
) {
  const { data: row, error } = await supabase
    .from("admin_traitements")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;
  const { data: lineRows, error: lineErr } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .eq("traitement_id", id)
    .order("sort_order");
  if (lineErr) throw new Error(lineErr.message);
  return mapTraitementRow(
    row as Record<string, unknown>,
    (lineRows ?? []).map((l) => mapTraitementLine(l as Record<string, unknown>)),
  );
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { id } = await ctx.params;

  const body = (await request.json().catch(() => ({}))) as {
    customerId?: string;
    customerName?: string;
    label?: string;
    lines?: { id: string; qty?: number; unitPrice?: number }[];
  };

  const supabase = getSupabaseAdminClient();
  try {
    const result = await createVenteTraitementFromAchat(supabase, organizationId, userId, id, body);
    const vente = await loadTraitementWithLines(supabase, result.traitementId, organizationId);
    return NextResponse.json({ ...result, traitement: vente });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Conversion impossible" },
      { status: 400 },
    );
  }
}
