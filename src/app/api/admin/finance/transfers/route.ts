import { NextResponse } from "next/server";
import { assertFinanceManage } from "@/lib/admin/finance-permissions";
import { MOVEMENT_SELECT, mapFinanceMovement, newFinanceId } from "@/lib/admin/finance-server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceManage(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as {
    fromAccountId?: string;
    toAccountId?: string;
    amount?: number;
    movementDate?: string;
    reference?: string;
    notes?: string | null;
  };

  if (!body.fromAccountId || !body.toAccountId || !body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Comptes et montant requis" }, { status: 400 });
  }
  if (body.fromAccountId === body.toAccountId) {
    return NextResponse.json({ error: "Comptes identiques" }, { status: 400 });
  }
  if (!body.reference?.trim() || !body.movementDate) {
    return NextResponse.json({ error: "Date et référence requises" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: accounts } = await supabase
    .from("admin_finance_accounts")
    .select("id, account_type")
    .eq("organization_id", auth.organizationId)
    .in("id", [body.fromAccountId, body.toAccountId]);
  if ((accounts ?? []).length !== 2) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const { data: transferCategory } = await supabase
    .from("admin_finance_categories")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .eq("slug", "divers")
    .maybeSingle();
  if (!transferCategory) {
    return NextResponse.json({ error: "Catégorie divers introuvable" }, { status: 500 });
  }

  const transferGroupId = crypto.randomUUID();
  const date = body.movementDate.slice(0, 10);
  const refOut = `${body.reference.trim()}-OUT`;
  const refIn = `${body.reference.trim()}-IN`;

  const outId = newFinanceId("fmov");
  const inId = newFinanceId("fmov");

  const { error: outErr } = await supabase.from("admin_finance_movements").insert({
    id: outId,
    organization_id: auth.organizationId,
    account_id: body.fromAccountId,
    category_id: transferCategory.id,
    movement_type: "transfer_out",
    amount: body.amount,
    movement_date: date,
    reference: refOut,
    payment_method: "transfer",
    transfer_group_id: transferGroupId,
    created_by: auth.userId,
    notes: body.notes?.trim() || null,
  });
  if (outErr) return NextResponse.json({ error: outErr.message }, { status: 500 });

  const { data: inRow, error: inErr } = await supabase
    .from("admin_finance_movements")
    .insert({
      id: inId,
      organization_id: auth.organizationId,
      account_id: body.toAccountId,
      category_id: transferCategory.id,
      movement_type: "transfer_in",
      amount: body.amount,
      movement_date: date,
      reference: refIn,
      payment_method: "transfer",
      transfer_group_id: transferGroupId,
      created_by: auth.userId,
      notes: body.notes?.trim() || null,
    })
    .select(MOVEMENT_SELECT)
    .single();

  if (inErr) {
    await supabase.from("admin_finance_movements").delete().eq("id", outId);
    return NextResponse.json({ error: inErr.message }, { status: 500 });
  }

  return NextResponse.json({
    transferGroupId,
    outReference: refOut,
    inReference: refIn,
    movements: [
      mapFinanceMovement({ ...(inRow as Record<string, unknown>) }),
    ],
  });
}
