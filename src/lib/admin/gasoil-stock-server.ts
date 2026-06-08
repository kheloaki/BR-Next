import { computeStockStatus } from "@/components/admin/operations-types";
import type { StockItem } from "@/components/admin/operations-types";
import {
  DEFAULT_GASOIL_STOCK,
  GASOIL_STOCK_CATEGORY,
  findGasoilStockItem,
  isGasoilStockItem,
} from "@/lib/admin/gasoil-stock";
import type { GasoilBonType } from "@/components/admin/operations-types";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

function mapStockRow(row: {
  id: string;
  reference: string;
  designation: string;
  category: string;
  article_code?: string | null;
  unit?: string | null;
  qty: number;
  min_qty: number;
  unit_price: number;
}): StockItem {
  const qty = Number(row.qty ?? 0);
  const minQty = Number(row.min_qty ?? 0);
  return {
    id: row.id,
    reference: row.reference,
    designation: row.designation,
    category: row.category,
    articleCode: row.article_code?.trim() || "",
    unit: row.unit?.trim() || "L",
    qty,
    minQty,
    unitPrice: Number(row.unit_price ?? 0),
    status: computeStockStatus(qty, minQty),
  };
}

export async function listStockRowsForUser(supabase: Supabase, organizationId: string) {
  const { data, error } = await supabase
    .from("admin_stock_items")
    .select("id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
    .eq("organization_id", organizationId)
    .order("designation");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapStockRow);
}

export async function getGasoilStockItem(
  supabase: Supabase,
  organizationId: string,
): Promise<StockItem | null> {
  const items = await listStockRowsForUser(supabase, organizationId);
  return findGasoilStockItem(items);
}

export async function getOrCreateGasoilStockItem(
  supabase: Supabase,
  organizationId: string,
  userId: string,
): Promise<StockItem> {
  const existing = await getGasoilStockItem(supabase, organizationId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("admin_stock_items")
    .insert({
      id: opsId("stk"),
      user_id: userId,
      organization_id: organizationId,
      reference: DEFAULT_GASOIL_STOCK.reference,
      designation: DEFAULT_GASOIL_STOCK.designation,
      category: GASOIL_STOCK_CATEGORY,
      unit: "L",
      qty: 0,
      min_qty: 0,
      unit_price: 0,
    })
    .select("id, reference, designation, category, article_code, unit, qty, min_qty, unit_price")
    .single();

  if (error) throw new Error(error.message);
  return mapStockRow(data);
}

function stockQtyDelta(bonType: GasoilBonType, litres: number) {
  const n = Math.abs(litres);
  return bonType === "achat" ? n : -n;
}

/** Reverse stock movement when a bon is deleted. */
export async function reverseGasoilStockForBon(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  params: {
    bonType: GasoilBonType;
    litres: number;
    projectId?: string | null;
    bonNumber: string;
  },
) {
  const litres = Math.max(0, Number(params.litres) || 0);
  if (litres <= 0) return null;

  const stock = await getGasoilStockItem(supabase, organizationId);
  if (!stock) return null;

  const reverseType: GasoilBonType = params.bonType === "achat" ? "sortie" : "achat";
  const delta = stockQtyDelta(reverseType, litres);
  const newQty = Math.max(0, stock.qty + delta);

  const project = await resolveProjectFields(supabase, organizationId, params.projectId);
  const movementType = reverseType === "achat" ? "entry" : "exit";

  const { error: movErr } = await supabase.from("admin_stock_movements").insert({
    id: opsId("mov"),
    user_id: userId,
    organization_id: organizationId,
    item_id: stock.id,
    movement_type: movementType,
    movement_date: new Date().toISOString().slice(0, 10),
    reference: stock.reference,
    designation: stock.designation,
    category: GASOIL_STOCK_CATEGORY,
    qty: litres,
    unit_price: stock.unitPrice,
    supplier: "",
    delivery_note: `Annulation ${params.bonNumber}`,
    project_id: project.project_id,
    site_name: project.site_name,
    depot_id: null,
    notes: `Annulation bon ${params.bonNumber}`,
  });

  if (movErr) throw new Error(movErr.message);

  const { error: updErr } = await supabase
    .from("admin_stock_items")
    .update({ qty: newQty, updated_at: new Date().toISOString() })
    .eq("id", stock.id)
    .eq("organization_id", organizationId);

  if (updErr) throw new Error(updErr.message);
  return { newQty };
}

/** Adjust gasoil stock when a bon d'achat or bon de sortie is recorded. */
export async function applyGasoilStockForBon(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  params: {
    bonType: GasoilBonType;
    litres: number;
    projectId?: string;
    deliveryNote?: string;
    supplier?: string;
    beneficiary?: string;
    bonNumber: string;
    bonDate?: string;
    unitPricePerLitre?: number;
  },
): Promise<{ newQty: number; unitPricePerLitre: number } | null> {
  const litres = Math.max(0, Number(params.litres) || 0);
  if (litres <= 0) return null;

  let stock = await getGasoilStockItem(supabase, organizationId);
  if (!stock) {
    stock = await getOrCreateGasoilStockItem(supabase, organizationId, userId);
  }

  const purchasePrice =
    params.bonType === "achat" && params.unitPricePerLitre != null && params.unitPricePerLitre > 0
      ? params.unitPricePerLitre
      : null;
  const movementUnitPrice = purchasePrice ?? stock.unitPrice;

  const delta = stockQtyDelta(params.bonType, litres);
  const newQty = Math.max(0, stock.qty + delta);
  if (params.bonType === "sortie" && stock.qty < litres) {
    throw new Error(`Stock insuffisant (${stock.qty.toLocaleString("fr-MA")} L disponibles).`);
  }

  if (purchasePrice != null) {
    const { error: priceErr } = await supabase
      .from("admin_stock_items")
      .update({ unit_price: purchasePrice, updated_at: new Date().toISOString() })
      .eq("id", stock.id)
      .eq("organization_id", organizationId);
    if (priceErr) throw new Error(priceErr.message);
  }

  const project = await resolveProjectFields(supabase, organizationId, params.projectId);
  const movementType = params.bonType === "achat" ? "entry" : "exit";
  const notes = [
    params.bonNumber,
    params.beneficiary && `Bénéf. ${params.beneficiary}`,
    params.supplier && `Fourn. ${params.supplier}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const { error: movErr } = await supabase.from("admin_stock_movements").insert({
    id: opsId("mov"),
    user_id: userId,
    organization_id: organizationId,
    item_id: stock.id,
    movement_type: movementType,
    movement_date: params.bonDate?.trim() || new Date().toISOString().slice(0, 10),
    reference: stock.reference,
    designation: stock.designation,
    category: GASOIL_STOCK_CATEGORY,
    qty: litres,
    unit_price: movementUnitPrice,
    supplier: params.supplier?.trim() || "",
    delivery_note: params.deliveryNote?.trim() || params.bonNumber,
    project_id: project.project_id,
    site_name: project.site_name,
    depot_id: null,
    notes,
  });

  if (movErr) throw new Error(movErr.message);

  const { error: updErr } = await supabase
    .from("admin_stock_items")
    .update({ qty: newQty, updated_at: new Date().toISOString() })
    .eq("id", stock.id)
    .eq("organization_id", organizationId);

  if (updErr) throw new Error(updErr.message);
  return { newQty, unitPricePerLitre: movementUnitPrice };
}

export async function assertNotGasoilStockItem(
  supabase: Supabase,
  organizationId: string,
  itemId: string,
): Promise<void> {
  const { data } = await supabase
    .from("admin_stock_items")
    .select("id, reference, designation, category")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (data && isGasoilStockItem(data)) {
    throw new Error("Le stock gasoil se gère dans le module Carburant.");
  }
}
