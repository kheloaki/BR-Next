import type { StockMovementType } from "@/components/admin/operations-types";
import { opsId } from "@/lib/admin/ops-id";
import { roundMoney } from "@/lib/admin/price-ht-ttc";
import { stockMovementQtyDelta } from "@/lib/admin/stock-movement-qty";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

export type DepotStockMovementFields = {
  reference: string;
  designation: string;
  category: string;
  articleCode: string;
  unit: string;
  unitPrice: number;
  assignment: string;
  exitVoucherNo: string;
  requester: string;
  storekeeper: string;
  supplier: string;
  deliveryNote: string;
  projectId: string | null;
  siteName: string;
  notes: string;
};

export async function getDepotStockQty(
  supabase: Supabase,
  organizationId: string,
  depotId: string,
  stockItemId: string,
): Promise<number> {
  const { data } = await supabase
    .from("admin_depot_stock")
    .select("qty")
    .eq("organization_id", organizationId)
    .eq("depot_id", depotId)
    .eq("stock_item_id", stockItemId)
    .maybeSingle();
  return Number(data?.qty ?? 0);
}

async function upsertDepotStockQty(
  supabase: Supabase,
  organizationId: string,
  depotId: string,
  stockItemId: string,
  qty: number,
) {
  const nextQty = Math.max(0, roundMoney(qty));
  const { data: existing } = await supabase
    .from("admin_depot_stock")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("depot_id", depotId)
    .eq("stock_item_id", stockItemId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("admin_depot_stock")
      .update({ qty: nextQty, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("organization_id", organizationId);
    if (error) throw new Error(error.message);
    return nextQty;
  }

  const { error } = await supabase.from("admin_depot_stock").insert({
    id: opsId("dst"),
    organization_id: organizationId,
    depot_id: depotId,
    stock_item_id: stockItemId,
    qty: nextQty,
  });
  if (error) throw new Error(error.message);
  return nextQty;
}

async function adjustDepotStockQty(
  supabase: Supabase,
  organizationId: string,
  depotId: string,
  stockItemId: string,
  delta: number,
) {
  const current = await getDepotStockQty(supabase, organizationId, depotId, stockItemId);
  return upsertDepotStockQty(supabase, organizationId, depotId, stockItemId, current + delta);
}

async function fetchStockItemQty(supabase: Supabase, organizationId: string, itemId: string) {
  const { data, error } = await supabase
    .from("admin_stock_items")
    .select("qty")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .single();
  if (error || !data) throw new Error("Article introuvable");
  return Number(data.qty ?? 0);
}

async function updateGlobalStockQty(
  supabase: Supabase,
  organizationId: string,
  itemId: string,
  newQty: number,
) {
  const qty = Math.max(0, roundMoney(newQty));
  const { error } = await supabase
    .from("admin_stock_items")
    .update({ qty, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("organization_id", organizationId);
  if (error) throw new Error(error.message);
  return qty;
}

export async function recordStockMovementWithDepot(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  params: {
    itemId: string;
    movementType: StockMovementType;
    qty: number;
    movementDate: string;
    depotId?: string | null;
    destinationDepotId?: string | null;
    fields: DepotStockMovementFields;
    movementId?: string;
  },
): Promise<{ movementId: string; newGlobalQty: number; sourceDepotQty?: number; destDepotQty?: number }> {
  const qty = Math.max(0, Number(params.qty) || 0);
  if (qty <= 0) throw new Error("Quantité invalide");

  const movementId = params.movementId ?? opsId("mov");
  const globalQty = await fetchStockItemQty(supabase, organizationId, params.itemId);

  if (params.movementType === "transfer") {
    const fromDepot = params.depotId?.trim();
    const toDepot = params.destinationDepotId?.trim();
    if (!fromDepot || !toDepot) {
      throw new Error("Dépôt source et dépôt destination requis pour un transfert.");
    }
    if (fromDepot === toDepot) {
      throw new Error("Les dépôts source et destination doivent être différents.");
    }

    const sourceQty = await getDepotStockQty(supabase, organizationId, fromDepot, params.itemId);
    if (sourceQty < qty) {
      throw new Error(`Stock insuffisant au dépôt source (${sourceQty} disponibles, ${qty} demandés).`);
    }

    const newSourceQty = await adjustDepotStockQty(supabase, organizationId, fromDepot, params.itemId, -qty);
    const newDestQty = await adjustDepotStockQty(supabase, organizationId, toDepot, params.itemId, qty);

    const { error: movErr } = await supabase.from("admin_stock_movements").insert({
      id: movementId,
      user_id: userId,
      organization_id: organizationId,
      item_id: params.itemId,
      movement_type: "transfer",
      movement_date: params.movementDate,
      qty,
      unit_price: params.fields.unitPrice,
      stock_after: globalQty,
      depot_id: fromDepot,
      destination_depot_id: toDepot,
      reference: params.fields.reference,
      designation: params.fields.designation,
      category: params.fields.category,
      article_code: params.fields.articleCode,
      unit: params.fields.unit,
      assignment: params.fields.assignment,
      exit_voucher_no: params.fields.exitVoucherNo,
      requester: params.fields.requester,
      storekeeper: params.fields.storekeeper,
      supplier: params.fields.supplier,
      delivery_note: params.fields.deliveryNote,
      project_id: params.fields.projectId,
      site_name: params.fields.siteName,
      notes: params.fields.notes,
    });
    if (movErr) throw new Error(movErr.message);

    return {
      movementId,
      newGlobalQty: globalQty,
      sourceDepotQty: newSourceQty,
      destDepotQty: newDestQty,
    };
  }

  const delta = stockMovementQtyDelta(params.movementType, qty);
  const depotId = params.depotId?.trim() || null;

  if (depotId && params.movementType === "exit") {
    const depotQty = await getDepotStockQty(supabase, organizationId, depotId, params.itemId);
    if (depotQty < qty) {
      throw new Error(`Stock insuffisant au dépôt (${depotQty} disponibles, ${qty} demandés).`);
    }
  } else if (!depotId && params.movementType === "exit" && globalQty < qty) {
    throw new Error(`Stock insuffisant (${globalQty} disponibles, ${qty} demandés).`);
  }

  const newGlobalQty = Math.max(0, globalQty + delta);
  let sourceDepotQty: number | undefined;

  if (depotId) {
    sourceDepotQty = await adjustDepotStockQty(supabase, organizationId, depotId, params.itemId, delta);
  }

  await updateGlobalStockQty(supabase, organizationId, params.itemId, newGlobalQty);

  const { error: movErr } = await supabase.from("admin_stock_movements").insert({
    id: movementId,
    user_id: userId,
    organization_id: organizationId,
    item_id: params.itemId,
    movement_type: params.movementType,
    movement_date: params.movementDate,
    qty,
    unit_price: params.fields.unitPrice,
    stock_after: newGlobalQty,
    depot_id: depotId,
    destination_depot_id: null,
    reference: params.fields.reference,
    designation: params.fields.designation,
    category: params.fields.category,
    article_code: params.fields.articleCode,
    unit: params.fields.unit,
    assignment: params.fields.assignment,
    exit_voucher_no: params.fields.exitVoucherNo,
    requester: params.fields.requester,
    storekeeper: params.fields.storekeeper,
    supplier: params.fields.supplier,
    delivery_note: params.fields.deliveryNote,
    project_id: params.fields.projectId,
    site_name: params.fields.siteName,
    notes: params.fields.notes,
  });
  if (movErr) throw new Error(movErr.message);

  return { movementId, newGlobalQty, sourceDepotQty };
}

export async function reverseDepotMovementEffect(
  supabase: Supabase,
  organizationId: string,
  mov: {
    movement_type: string;
    qty: number;
    item_id: string;
    depot_id: string | null;
    destination_depot_id: string | null;
  },
) {
  const qty = Number(mov.qty ?? 0);
  const itemId = mov.item_id as string;
  const type = mov.movement_type as StockMovementType;

  if (type === "transfer") {
    const fromDepot = mov.depot_id;
    const toDepot = mov.destination_depot_id;
    if (fromDepot && toDepot) {
      await adjustDepotStockQty(supabase, organizationId, fromDepot, itemId, qty);
      await adjustDepotStockQty(supabase, organizationId, toDepot, itemId, -qty);
    }
    return;
  }

  const delta = stockMovementQtyDelta(type, qty);
  if (mov.depot_id) {
    await adjustDepotStockQty(supabase, organizationId, mov.depot_id, itemId, -delta);
  }
}

export async function applyDepotMovementEffect(
  supabase: Supabase,
  organizationId: string,
  mov: {
    movement_type: string;
    qty: number;
    item_id: string;
    depot_id: string | null;
    destination_depot_id: string | null;
  },
) {
  const qty = Number(mov.qty ?? 0);
  const itemId = mov.item_id as string;
  const type = mov.movement_type as StockMovementType;

  if (type === "transfer") {
    const fromDepot = mov.depot_id;
    const toDepot = mov.destination_depot_id;
    if (fromDepot && toDepot) {
      await adjustDepotStockQty(supabase, organizationId, fromDepot, itemId, -qty);
      await adjustDepotStockQty(supabase, organizationId, toDepot, itemId, qty);
    }
    return;
  }

  const delta = stockMovementQtyDelta(type, qty);
  if (mov.depot_id) {
    await adjustDepotStockQty(supabase, organizationId, mov.depot_id, itemId, delta);
  }
}

export async function listDepotStockBalances(
  supabase: Supabase,
  organizationId: string,
  opts?: { depotId?: string; stockItemId?: string },
) {
  let query = supabase
    .from("admin_depot_stock")
    .select("id, depot_id, stock_item_id, qty, updated_at")
    .eq("organization_id", organizationId)
    .gt("qty", 0)
    .order("updated_at", { ascending: false });

  if (opts?.depotId) query = query.eq("depot_id", opts.depotId);
  if (opts?.stockItemId) query = query.eq("stock_item_id", opts.stockItemId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    depotId: r.depot_id as string,
    stockItemId: r.stock_item_id as string,
    qty: Number(r.qty ?? 0),
    updatedAt: r.updated_at as string,
  }));
}
