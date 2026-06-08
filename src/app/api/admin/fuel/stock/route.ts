import { NextResponse } from "next/server";
import type { StockMovementType } from "@/components/admin/operations-types";
import { GASOIL_STOCK_CATEGORY } from "@/lib/admin/gasoil-stock";
import { resolveGasoilUnitPrice } from "@/lib/admin/gasoil-unit-price";
import {
  getGasoilStockItem,
  getOrCreateGasoilStockItem,
  listStockRowsForUser,
} from "@/lib/admin/gasoil-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseAdminClient();
  const item = await getGasoilStockItem(supabase, auth.organizationId);

  let movements: {
    id: string;
    movement_type: string;
    qty: number;
    unit_price: number;
  }[] = [];

  if (item?.id) {
    const { data } = await supabase
      .from("admin_stock_movements")
      .select("id, movement_type, qty, unit_price")
      .eq("organization_id", auth.organizationId)
      .eq("item_id", item.id)
      .order("movement_date", { ascending: false })
      .limit(100);
    movements = (data ?? []) as typeof movements;
  }

  const unitPriceInfo = resolveGasoilUnitPrice(
    item,
    movements.map((m) => ({
      movementType: m.movement_type as StockMovementType,
      qty: Number(m.qty ?? 0),
      unitPrice: Number(m.unit_price ?? 0),
    })),
  );

  return NextResponse.json({ item, unitPriceInfo });
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    action?: "ensure" | "update";
    minQty?: number;
    unitPrice?: number;
    reference?: string;
    designation?: string;
  };

  const supabase = getSupabaseAdminClient();
  const action = body.action ?? "ensure";

  if (action === "ensure") {
    const item = await getOrCreateGasoilStockItem(supabase, organizationId, userId);
    return NextResponse.json({ item });
  }

  let item = await getGasoilStockItem(supabase, organizationId);
  if (!item) {
    item = await getOrCreateGasoilStockItem(supabase, organizationId, userId);
  }

  if (action === "update") {
    const payload = {
      reference: body.reference?.trim() ?? item.reference,
      designation: body.designation?.trim() ?? item.designation,
      category: GASOIL_STOCK_CATEGORY,
      min_qty: body.minQty != null ? Math.max(0, Number(body.minQty)) : item.minQty,
      unit_price: body.unitPrice != null ? Math.max(0, Number(body.unitPrice)) : item.unitPrice,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("admin_stock_items")
      .update(payload)
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .select("id, reference, designation, category, qty, min_qty, unit_price")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = await listStockRowsForUser(supabase, organizationId);
    const updated = rows.find((r) => r.id === data.id);
    return NextResponse.json({ item: updated ?? null });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
