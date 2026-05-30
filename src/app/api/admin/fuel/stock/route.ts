import { NextResponse } from "next/server";
import type { StockMovementType } from "@/components/admin/operations-types";
import { GASOIL_STOCK_CATEGORY } from "@/lib/admin/gasoil-stock";
import {
  getGasoilStockItem,
  getOrCreateGasoilStockItem,
  listStockRowsForUser,
} from "@/lib/admin/gasoil-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function qtyDelta(type: StockMovementType, qty: number) {
  const n = Math.abs(qty);
  if (type === "entry" || type === "return") return n;
  return -n;
}

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const supabase = getSupabaseAdminClient();
  const item = await getGasoilStockItem(supabase, auth.organizationId);
  return NextResponse.json({ item });
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    action?: "ensure" | "update" | "movement";
    minQty?: number;
    unitPrice?: number;
    reference?: string;
    designation?: string;
    movementType?: StockMovementType;
    qty?: number;
    movementDate?: string;
    projectId?: string;
    supplier?: string;
    deliveryNote?: string;
    notes?: string;
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

  if (action === "movement") {
    if (!body.movementType) {
      return NextResponse.json({ error: "Type de mouvement requis" }, { status: 400 });
    }
    const qty = Math.max(0, Number(body.qty) || 0);
    if (qty <= 0) {
      return NextResponse.json({ error: "Quantité requise" }, { status: 400 });
    }

    const { data: row, error: itemErr } = await supabase
      .from("admin_stock_items")
      .select("id, reference, designation, category, qty, unit_price")
      .eq("id", item.id)
      .eq("organization_id", organizationId)
      .single();

    if (itemErr || !row) {
      return NextResponse.json({ error: "Stock gasoil introuvable" }, { status: 404 });
    }

    const delta = qtyDelta(body.movementType, qty);
    const newQty = Math.max(0, Number(row.qty ?? 0) + delta);
    const project = await resolveProjectFields(supabase, organizationId, body.projectId);

    const { error: movErr } = await supabase.from("admin_stock_movements").insert({
      id: opsId("mov"),
      user_id: userId, organization_id: organizationId,
      item_id: row.id,
      movement_type: body.movementType,
      movement_date: body.movementDate || new Date().toISOString().slice(0, 10),
      reference: row.reference,
      designation: row.designation,
      category: GASOIL_STOCK_CATEGORY,
      qty,
      unit_price: Number(row.unit_price ?? 0),
      supplier: body.supplier?.trim() || "",
      delivery_note: body.deliveryNote?.trim() || "",
      project_id: project.project_id,
      site_name: project.site_name,
      depot_id: null,
      notes: body.notes?.trim() || "",
    });

    if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

    const { error: updErr } = await supabase
      .from("admin_stock_items")
      .update({ qty: newQty, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("organization_id", organizationId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    const rows = await listStockRowsForUser(supabase, organizationId);
    const updated = rows.find((r) => r.id === row.id);
    return NextResponse.json({ item: updated ?? null, newQty });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
