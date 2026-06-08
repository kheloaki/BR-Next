import { NextResponse } from "next/server";
import { mapPurchaseRequestRow } from "@/lib/admin/map-purchase-request";
import { createTraitementFromPurchaseRequest } from "@/lib/admin/purchase-request-traitement";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { id } = await ctx.params;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_purchase_requests")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "DA introuvable" }, { status: 404 });

  try {
    const result = await createTraitementFromPurchaseRequest(
      supabase,
      organizationId,
      userId,
      mapPurchaseRequestRow(data as Record<string, unknown>),
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Conversion impossible" },
      { status: 400 },
    );
  }
}
