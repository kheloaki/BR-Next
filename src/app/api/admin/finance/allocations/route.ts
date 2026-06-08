import { NextResponse } from "next/server";
import { assertFinanceManage } from "@/lib/admin/finance-permissions";
import {
  MOVEMENT_SELECT,
  mapFinanceMovement,
  newFinanceId,
  refreshFinanceDocumentTotals,
} from "@/lib/admin/finance-server";
import type { FinanceAllocationTargetType } from "@/lib/admin/finance-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const movementId = searchParams.get("movementId");
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  let query = getSupabaseAdminClient()
    .from("admin_finance_payment_allocations")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("allocated_at", { ascending: false });

  if (movementId) query = query.eq("movement_id", movementId);
  if (targetType) query = query.eq("target_type", targetType);
  if (targetId) query = query.eq("target_id", targetId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as {
    movementId?: string;
    targetType?: FinanceAllocationTargetType;
    targetId?: string;
    allocatedAmount?: number;
    notes?: string | null;
  };

  if (!body.movementId || !body.targetType || !body.targetId || !body.allocatedAmount || body.allocatedAmount <= 0) {
    return NextResponse.json({ error: "Données d'allocation invalides" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: movement } = await supabase
    .from("admin_finance_movements")
    .select("amount, voided_at")
    .eq("id", body.movementId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  if (!movement || movement.voided_at) {
    return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("admin_finance_payment_allocations")
    .select("allocated_amount")
    .eq("movement_id", body.movementId);

  const already = (existing ?? []).reduce((s, r) => s + Number(r.allocated_amount), 0);
  if (already + body.allocatedAmount! > Number(movement.amount) + 0.01) {
    return NextResponse.json({ error: "Montant alloué supérieur au paiement" }, { status: 400 });
  }

  const id = newFinanceId("falloc");
  const { data, error } = await supabase
    .from("admin_finance_payment_allocations")
    .insert({
      id,
      organization_id: auth.organizationId,
      movement_id: body.movementId,
      target_type: body.targetType,
      target_id: body.targetId,
      allocated_amount: body.allocatedAmount,
      notes: body.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.targetType === "finance_document") {
    await refreshFinanceDocumentTotals(body.targetId, auth.organizationId);
  }

  return NextResponse.json(data);
}
