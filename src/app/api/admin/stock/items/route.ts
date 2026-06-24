import { NextResponse } from "next/server";
import { csvResponse } from "@/lib/admin/csv-response";
import {
  inventoryToStockItem,
  loadArticlesWithInventory,
  loadInventoryRows,
  loadProducts,
} from "@/lib/admin/article-inventory";
import { excludeGasoilFromStockList, GASOIL_STOCK_MODULE_MESSAGE, isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const alertsOnly = searchParams.get("alerts") === "1";

  const supabase = getSupabaseAdminClient();
  const [products, inventoryRows] = await Promise.all([
    loadProducts(supabase, organizationId),
    loadInventoryRows(supabase, organizationId),
  ]);

  const productById = new Map(products.map((p) => [p.id, p]));
  const merged = inventoryRows
    .map((inv) => {
      const product = inv.productId ? productById.get(inv.productId) : null;
      return inventoryToStockItem(inv, product);
    })
    .filter((item) => !isGasoilStockItem(item));

  let items = excludeGasoilFromStockList(merged);
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
  const { organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    productId?: string;
    qty?: number;
    minQty?: number;
    articleCode?: string;
  };

  if (!body.id?.trim() && !body.productId?.trim()) {
    return NextResponse.json(
      { error: "Sélectionnez un article du catalogue (productId) ou un inventaire existant (id)." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  let inventoryId = body.id?.trim() || "";

  if (!inventoryId && body.productId?.trim()) {
    const { data } = await supabase
      .from("admin_stock_items")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("product_id", body.productId.trim())
      .maybeSingle();
    inventoryId = (data?.id as string) || "";
  }

  if (!inventoryId) {
    return NextResponse.json({ error: "Inventaire introuvable pour cet article." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("admin_stock_items")
    .select("id, product_id, reference, designation, category")
    .eq("id", inventoryId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Inventaire introuvable." }, { status: 404 });
  }
  if (isGasoilStockItem(existing)) {
    return NextResponse.json({ error: GASOIL_STOCK_MODULE_MESSAGE }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.qty != null) payload.qty = Math.max(0, Number(body.qty) || 0);
  if (body.minQty != null) payload.min_qty = Math.max(0, Number(body.minQty) || 0);
  if (body.articleCode != null) payload.article_code = body.articleCode.trim();

  const { data, error } = await supabase
    .from("admin_stock_items")
    .update(payload)
    .eq("id", inventoryId)
    .eq("organization_id", organizationId)
    .select("id, product_id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const product = existing.product_id
    ? (await loadArticlesWithInventory(supabase, organizationId)).find((a) => a.id === existing.product_id)
    : null;

  return NextResponse.json(
    inventoryToStockItem(
      {
        id: data.id as string,
        productId: (data.product_id as string) || null,
        reference: (data.reference as string) || "",
        designation: (data.designation as string) || "",
        category: (data.category as string) || "",
        articleCode: ((data.article_code as string) || "").trim(),
        unit: ((data.unit as string) || "PIECE").trim(),
        qty: Number(data.qty ?? 0),
        minQty: Number(data.min_qty ?? 0),
        unitPrice: Number(data.unit_price ?? 0),
      },
      product,
    ),
  );
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
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
      { error: GASOIL_STOCK_MODULE_MESSAGE },
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
