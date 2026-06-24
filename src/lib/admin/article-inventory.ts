import type { Product } from "@/components/admin/devis-types";
import { computeStockStatus } from "@/components/admin/operations-types";
import { GASOIL_STOCK_MODULE_MESSAGE, GASOIL_UNIT, isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { getGasoilStockItem, getOrCreateGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import { opsId } from "@/lib/admin/ops-id";
import type { TraitementType, TraitementSupplyKind } from "@/lib/admin/traitement-types";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

const INVENTORY_SELECT =
  "id, product_id, reference, designation, category, article_code, unit, qty, min_qty, unit_price";

export type InventoryRow = {
  id: string;
  productId: string | null;
  reference: string;
  designation: string;
  category: string;
  articleCode: string;
  unit: string;
  qty: number;
  minQty: number;
  unitPrice: number;
};

export type ArticleWithInventory = Product & {
  inventoryId: string | null;
  qty: number;
  minQty: number;
  status: "ok" | "low" | "out";
};

function mapInventoryRow(row: Record<string, unknown>): InventoryRow {
  return {
    id: row.id as string,
    productId: (row.product_id as string) || null,
    reference: (row.reference as string) || "",
    designation: (row.designation as string) || "",
    category: (row.category as string) || "",
    articleCode: ((row.article_code as string) || "").trim(),
    unit: ((row.unit as string) || "PIECE").trim(),
    qty: Number(row.qty ?? 0),
    minQty: Number(row.min_qty ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    reference: (row.reference as string) || "",
    designation: (row.designation as string) || "",
    category: (row.category as string) || "",
    unit: ((row.unit as string) || "u").trim(),
    unitPrice: Number(row.unit_price ?? 0),
  };
}

export function mergeArticleInventory(
  product: Product,
  inventory: InventoryRow | null,
): ArticleWithInventory {
  const qty = inventory?.qty ?? 0;
  const minQty = inventory?.minQty ?? 0;
  return {
    ...product,
    inventoryId: inventory?.id ?? null,
    qty,
    minQty,
    status: computeStockStatus(qty, minQty),
  };
}

/** Inventory row enriched for legacy StockItem consumers (movements use inventory id). */
export function inventoryToStockItem(row: InventoryRow, product?: Product | null) {
  const qty = row.qty;
  const minQty = row.minQty;
  return {
    id: row.id,
    productId: row.productId ?? null,
    reference: product?.reference ?? row.reference,
    designation: product?.designation ?? row.designation,
    category: product?.category ?? row.category,
    articleCode: row.articleCode,
    unit: product?.unit ?? row.unit,
    qty,
    minQty,
    unitPrice: product?.unitPrice ?? row.unitPrice,
    status: computeStockStatus(qty, minQty),
  };
}

export async function loadProducts(
  supabase: Supabase,
  organizationId: string,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("admin_products")
    .select("id, reference, designation, category, unit, unit_price")
    .eq("organization_id", organizationId)
    .order("designation");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapProduct(r as Record<string, unknown>));
}

export async function loadInventoryRows(
  supabase: Supabase,
  organizationId: string,
): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from("admin_stock_items")
    .select(INVENTORY_SELECT)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapInventoryRow(r as Record<string, unknown>));
}

export async function loadArticlesWithInventory(
  supabase: Supabase,
  organizationId: string,
): Promise<ArticleWithInventory[]> {
  const [products, inventory] = await Promise.all([
    loadProducts(supabase, organizationId),
    loadInventoryRows(supabase, organizationId),
  ]);
  const byProduct = new Map<string, InventoryRow>();
  for (const row of inventory) {
    if (row.productId) byProduct.set(row.productId, row);
  }
  return products.map((p) => mergeArticleInventory(p, byProduct.get(p.id) ?? null));
}

export async function getProductById(
  supabase: Supabase,
  organizationId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("admin_products")
    .select("id, reference, designation, category, unit, unit_price")
    .eq("id", productId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export async function getInventoryByProductId(
  supabase: Supabase,
  organizationId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("admin_stock_items")
    .select(INVENTORY_SELECT)
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapInventoryRow(data as Record<string, unknown>) : null;
}

export async function ensureInventoryForProduct(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  productId: string,
): Promise<InventoryRow> {
  const existing = await getInventoryByProductId(supabase, organizationId, productId);
  if (existing) return existing;

  const product = await getProductById(supabase, organizationId, productId);
  if (!product) throw new Error("Article introuvable.");

  if (
    isGasoilStockItem({
      reference: product.reference,
      designation: product.designation,
      category: product.category,
    })
  ) {
    throw new Error(GASOIL_STOCK_MODULE_MESSAGE);
  }

  const payload = {
    id: opsId("stk"),
    user_id: userId,
    organization_id: organizationId,
    product_id: productId,
    reference: product.reference,
    designation: product.designation,
    category: product.category,
    unit: product.unit || "PIECE",
    article_code: "",
    qty: 0,
    min_qty: 0,
    unit_price: product.unitPrice,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("admin_stock_items")
    .insert(payload)
    .select(INVENTORY_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapInventoryRow(data as Record<string, unknown>);
}

export async function syncInventoryFromProduct(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  productId: string,
  product: Product,
) {
  await ensureInventoryForProduct(supabase, organizationId, userId, productId);
  const { error } = await supabase
    .from("admin_stock_items")
    .update({
      reference: product.reference,
      designation: product.designation,
      category: product.category,
      unit: product.unit || "PIECE",
      unit_price: product.unitPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", productId)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
}

export async function findInventoryForLine(
  supabase: Supabase,
  organizationId: string,
  line: {
    productId?: string | null;
    stockItemId?: string | null;
    reference?: string;
    designation?: string;
  },
): Promise<InventoryRow | null> {
  if (line.productId?.trim()) {
    return getInventoryByProductId(supabase, organizationId, line.productId.trim());
  }

  if (line.stockItemId?.trim()) {
    const { data } = await supabase
      .from("admin_stock_items")
      .select(INVENTORY_SELECT)
      .eq("id", line.stockItemId.trim())
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (data) return mapInventoryRow(data as Record<string, unknown>);
  }

  const ref = (line.reference ?? "").trim();
  if (ref) {
    const { data: product } = await supabase
      .from("admin_products")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("reference", ref)
      .maybeSingle();
    if (product?.id) {
      return getInventoryByProductId(supabase, organizationId, product.id as string);
    }
  }

  const des = (line.designation ?? "").trim();
  if (des) {
    const { data: products } = await supabase
      .from("admin_products")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("designation", des)
      .limit(1);
    if (products?.[0]?.id) {
      return getInventoryByProductId(supabase, organizationId, products[0].id as string);
    }
  }

  return null;
}

export async function resolveTraitementLineLinks(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  line: {
    productId?: string | null;
    stockItemId?: string | null;
    reference?: string;
    designation?: string;
    unit?: string;
    unitPrice?: number;
  },
  traitementType: TraitementType,
  options?: { supplyKind?: TraitementSupplyKind },
): Promise<{ productId: string | null; stockItemId: string | null; inventory: InventoryRow | null }> {
  let productId = line.productId?.trim() || null;

  if (!productId && line.stockItemId) {
    const { data } = await supabase
      .from("admin_stock_items")
      .select("product_id")
      .eq("id", line.stockItemId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    productId = (data?.product_id as string) || null;
  }

  if (!productId) {
    const inv = await findInventoryForLine(supabase, organizationId, line);
    productId = inv?.productId ?? null;
  }

  if (!productId && traitementType === "achat" && (line.designation ?? "").trim()) {
    const { data, error } = await supabase
      .from("admin_products")
      .insert({
        id: opsId("prd"),
        user_id: userId,
        organization_id: organizationId,
        reference: (line.reference ?? "").trim() || "NN",
        designation: (line.designation ?? "").trim(),
        category: "",
        unit: (line.unit ?? "").trim() || (options?.supplyKind === "gasoil" ? GASOIL_UNIT : "PIECE"),
        unit_price: Math.max(0, Number(line.unitPrice) || 0),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    productId = data.id as string;
  }

  if (!productId) {
    return { productId: null, stockItemId: line.stockItemId ?? null, inventory: null };
  }

  if (options?.supplyKind === "gasoil") {
    let stockItemId = line.stockItemId?.trim() || null;
    if (!stockItemId) {
      let gasoilStock = await getGasoilStockItem(supabase, organizationId);
      if (!gasoilStock && traitementType === "achat") {
        gasoilStock = await getOrCreateGasoilStockItem(supabase, organizationId, userId);
      }
      stockItemId = gasoilStock?.id ?? null;
    }
    return { productId, stockItemId, inventory: null };
  }

  const inventory = await ensureInventoryForProduct(supabase, organizationId, userId, productId);
  return { productId, stockItemId: inventory.id, inventory };
}
