import { NextResponse } from "next/server";
import { computeStockStatus } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import { excludeGasoilFromStockList, isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapItem(row: {
  id: string;
  reference: string;
  designation: string;
  category: string;
  article_code?: string;
  unit?: string;
  qty: number;
  min_qty: number;
  unit_price: number;
}) {
  const qty = Number(row.qty ?? 0);
  const minQty = Number(row.min_qty ?? 0);
  return {
    id: row.id,
    reference: row.reference,
    designation: row.designation,
    category: row.category,
    articleCode: row.article_code?.trim() || "",
    unit: row.unit?.trim() || "PIECE",
    qty,
    minQty,
    unitPrice: Number(row.unit_price ?? 0),
    status: computeStockStatus(qty, minQty),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const alertsOnly = searchParams.get("alerts") === "1";

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_stock_items")
    .select("id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
    .eq("organization_id", organizationId)
    .order("designation");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let items = excludeGasoilFromStockList((data ?? []).map(mapItem));
  if (alertsOnly) items = items.filter((i) => i.status !== "ok");

  if (searchParams.get("format") === "csv") {
    return csvResponse(
      "stock-inventaire.csv",
      ["Référence", "Désignation", "Catégorie", "Qté", "Seuil", "Prix", "Statut"],
      items.map((i) => [
        i.reference,
        i.designation,
        i.category,
        String(i.qty),
        String(i.minQty),
        String(i.unitPrice),
        i.status,
      ]),
    );
  }

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    reference?: string;
    designation?: string;
    category?: string;
    articleCode?: string;
    unit?: string;
    qty?: number;
    minQty?: number;
    unitPrice?: number;
  };
  if (!body.designation?.trim()) {
    return NextResponse.json({ error: "Désignation requise" }, { status: 400 });
  }

  if (
    isGasoilStockItem({
      category: body.category,
      reference: body.reference,
      designation: body.designation,
    })
  ) {
    return NextResponse.json(
      { error: "Le stock gasoil se gère dans le module Carburant." },
      { status: 400 },
    );
  }

  const payload = {
    reference: body.reference?.trim() || "",
    designation: body.designation.trim(),
    category: body.category?.trim() || "",
    article_code: body.articleCode?.trim() || "",
    unit: body.unit?.trim() || "PIECE",
    qty: Math.max(0, Number(body.qty) || 0),
    min_qty: Math.max(0, Number(body.minQty) || 0),
    unit_price: Math.max(0, Number(body.unitPrice) || 0),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (body.id?.trim()) {
    const { data: existingRow } = await supabase
      .from("admin_stock_items")
      .select("reference, designation, category")
      .eq("id", body.id.trim())
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (existingRow && isGasoilStockItem(existingRow)) {
      return NextResponse.json(
        { error: "Le stock gasoil se gère dans le module Carburant." },
        { status: 400 },
      );
    }
  }

  const result = body.id?.trim()
    ? await supabase
        .from("admin_stock_items")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select("id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
        .single()
    : await supabase
        .from("admin_stock_items")
        .insert({ id: opsId("stk"), user_id: userId, organization_id: organizationId, ...payload })
        .select("id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(mapItem(result.data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("admin_stock_items")
    .select("reference, designation, category")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (existing && isGasoilStockItem(existing)) {
    return NextResponse.json(
      { error: "Le stock gasoil se gère dans le module Carburant." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("admin_stock_items")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
