import { NextResponse } from "next/server";
import type { StockMovementType } from "@/components/admin/operations-types";
import { STOCK_MOVEMENT_LABELS } from "@/components/admin/operations-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { stockMovementsCsv } from "@/lib/admin/ops-csv-export";
import { assertNotGasoilStockItem, getGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import { GASOIL_STOCK_CATEGORY } from "@/lib/admin/gasoil-stock";
import { recordStockMovementWithDepot, reverseDepotMovementEffect, applyDepotMovementEffect } from "@/lib/admin/depot-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import {
  fetchStockItemForMovement,
  mapStockMovementRow,
  resolveExitVoucherNo,
  type StockMovementBody,
} from "@/lib/admin/map-stock-movement";
import { resolveDepotFields, resolveProjectFields } from "@/lib/admin/project-resolve";
import { stockMovementQtyDelta } from "@/lib/admin/stock-movement-qty";
import { isTraitementStockMovement } from "@/lib/admin/stock-traitement-link";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function qtyDelta(type: StockMovementType, qty: number) {
  return stockMovementQtyDelta(type, qty);
}

function movementInsertFields(
  body: StockMovementBody,
  item: Record<string, unknown>,
  project: { project_id: string | null; site_name: string },
  depot: { depot_id: string | null },
  extras: {
    qty: number;
    unitPrice: number;
    stockAfter: number;
    exitVoucherNo: string;
  },
) {
  const assignment =
    body.assignment?.trim() ||
    project.site_name ||
    "";
  return {
    reference: item.reference,
    designation: item.designation,
    category: item.category,
    article_code: body.articleCode?.trim() || (item.article_code as string) || "",
    unit: body.unit?.trim() || (item.unit as string) || "PIECE",
    qty: extras.qty,
    unit_price: extras.unitPrice,
    stock_after: extras.stockAfter,
    assignment,
    exit_voucher_no: extras.exitVoucherNo,
    requester: body.requester?.trim() || "",
    storekeeper: body.storekeeper?.trim() || "",
    supplier: body.supplier?.trim() || "",
    delivery_note: body.deliveryNote?.trim() || "",
    project_id: project.project_id,
    site_name: project.site_name,
    depot_id: depot.depot_id,
    notes: body.notes?.trim() || "",
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId");
  const typeFilter = url.searchParams.get("type");
  const exportFormat = url.searchParams.get("format");

  let query = getSupabaseAdminClient()
    .from("admin_stock_movements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (itemId) query = query.eq("item_id", itemId);
  if (typeFilter) query = query.eq("movement_type", typeFilter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let rows = data ?? [];
  if (!itemId) {
    const gasoil = await getGasoilStockItem(getSupabaseAdminClient(), organizationId);
    rows = rows.filter(
      (r) => r.item_id !== gasoil?.id && r.category !== GASOIL_STOCK_CATEGORY,
    );
  }

  const mapped = rows.map((r) => mapStockMovementRow(r as Record<string, unknown>));

  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return stockMovementsCsv(
      mapped.map((m) => ({
        movementDate: m.movementDate,
        movementType: STOCK_MOVEMENT_LABELS[m.movementType] ?? m.movementType,
        reference: m.reference,
        designation: m.designation,
        category: m.category,
        articleCode: m.articleCode,
        unit: m.unit,
        qty: m.qty,
        unitPrice: m.unitPrice,
        totalPriceHt: m.totalPriceHt,
        stockAfter: m.stockAfter,
        assignment: m.assignment,
        exitVoucherNo: m.exitVoucherNo,
        requester: m.requester,
        storekeeper: m.storekeeper,
        supplier: m.supplier,
        deliveryNote: m.deliveryNote,
        siteName: m.siteName,
        notes: m.notes,
      })),
      { itemId: itemId ?? undefined, format: parseExportFormat(exportFormat) },
    );
  }

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as StockMovementBody;

  if (!body.itemId || !body.movementType) {
    return NextResponse.json({ error: "Article et type requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: item, error: itemErr } = await fetchStockItemForMovement(organizationId, body.itemId);

  if (itemErr || !item) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  try {
    await assertNotGasoilStockItem(supabase, organizationId, item.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mouvement refusé" },
      { status: 400 },
    );
  }

  const qty = Math.max(0, Number(body.qty) || 0);
  if (qty <= 0) {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }

  const unitPrice = body.unitPrice != null ? Math.max(0, Number(body.unitPrice)) : Number(item.unit_price ?? 0);
  const exitVoucherNo = await resolveExitVoucherNo(organizationId, body.movementType, body.exitVoucherNo);

  const project = await resolveProjectFields(supabase, organizationId, body.projectId);
  const depot = await resolveDepotFields(supabase, organizationId, body.depotId);
  const destDepot = body.destinationDepotId
    ? await resolveDepotFields(supabase, organizationId, body.destinationDepotId)
    : { depot_id: null as string | null };

  const fields = movementInsertFields(body, item, project, depot, {
    qty,
    unitPrice,
    stockAfter: 0,
    exitVoucherNo,
  });

  try {
    const result = await recordStockMovementWithDepot(supabase, organizationId, userId, {
      itemId: item.id,
      movementType: body.movementType,
      qty,
      movementDate: body.movementDate || new Date().toISOString().slice(0, 10),
      depotId: depot.depot_id,
      destinationDepotId: destDepot.depot_id,
      fields: {
        reference: fields.reference as string,
        designation: fields.designation as string,
        category: fields.category as string,
        articleCode: fields.article_code as string,
        unit: fields.unit as string,
        unitPrice,
        assignment: fields.assignment as string,
        exitVoucherNo,
        requester: fields.requester as string,
        storekeeper: fields.storekeeper as string,
        supplier: fields.supplier as string,
        deliveryNote: fields.delivery_note as string,
        projectId: project.project_id,
        siteName: fields.site_name as string,
        notes: fields.notes as string,
      },
    });

    return NextResponse.json({
      ok: true,
      newQty: result.newGlobalQty,
      exitVoucherNo,
      movementId: result.movementId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mouvement impossible" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const body = (await request.json()) as StockMovementBody & { id?: string };

  if (!body.id?.trim()) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: mov, error: movErr } = await supabase
    .from("admin_stock_movements")
    .select("*")
    .eq("id", body.id.trim())
    .eq("organization_id", organizationId)
    .single();

  if (movErr || !mov) {
    return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
  }

  if (isTraitementStockMovement(String(mov.notes ?? ""))) {
    return NextResponse.json(
      {
        error:
          "Ce mouvement provient d'un traitement achat/vente. Modifiez-le via Traitements (BL ou BR), pas depuis le stock.",
      },
      { status: 400 },
    );
  }

  const { data: item, error: itemErr } = await fetchStockItemForMovement(organizationId, mov.item_id as string);

  if (itemErr || !item) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  try {
    await assertNotGasoilStockItem(supabase, organizationId, item.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Modification refusée" },
      { status: 400 },
    );
  }

  const newType = (body.movementType ?? mov.movement_type) as StockMovementType;
  const newQty = body.qty != null ? Math.max(0, Number(body.qty)) : Number(mov.qty ?? 0);
  if (newQty <= 0) {
    return NextResponse.json({ error: "Quantité invalide" }, { status: 400 });
  }

  const oldDelta = qtyDelta(mov.movement_type as StockMovementType, Number(mov.qty ?? 0));
  const newDelta = qtyDelta(newType, newQty);
  let adjustedQty = Number(item.qty ?? 0) - oldDelta + newDelta;

  try {
    await reverseDepotMovementEffect(supabase, organizationId, mov as {
      movement_type: string;
      qty: number;
      item_id: string;
      depot_id: string | null;
      destination_depot_id: string | null;
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Modification refusée" },
      { status: 400 },
    );
  }

  const project = await resolveProjectFields(
    supabase,
    organizationId,
    body.projectId !== undefined ? body.projectId : (mov.project_id as string | null),
  );
  const depot = await resolveDepotFields(
    supabase,
    organizationId,
    body.depotId !== undefined ? body.depotId : (mov.depot_id as string | null),
  );
  const destDepotId =
    body.destinationDepotId !== undefined
      ? body.destinationDepotId
      : (mov.destination_depot_id as string | null);

  const unitPrice =
    body.unitPrice != null ? Math.max(0, Number(body.unitPrice)) : Number(mov.unit_price ?? 0);
  const assignment =
    body.assignment !== undefined
      ? body.assignment.trim()
      : (mov.assignment as string) || project.site_name;

  const { error: updMovErr } = await supabase
    .from("admin_stock_movements")
    .update({
      movement_type: newType,
      movement_date: body.movementDate?.trim() || mov.movement_date,
      qty: newQty,
      unit_price: unitPrice,
      stock_after: adjustedQty,
      article_code:
        body.articleCode !== undefined ? body.articleCode.trim() : (mov.article_code as string),
      unit: body.unit !== undefined ? body.unit.trim() : (mov.unit as string),
      assignment,
      exit_voucher_no:
        body.exitVoucherNo !== undefined ? body.exitVoucherNo.trim() : (mov.exit_voucher_no as string),
      requester: body.requester !== undefined ? body.requester.trim() : (mov.requester as string),
      storekeeper:
        body.storekeeper !== undefined ? body.storekeeper.trim() : (mov.storekeeper as string),
      supplier: body.supplier !== undefined ? body.supplier.trim() : (mov.supplier as string),
      delivery_note:
        body.deliveryNote !== undefined ? body.deliveryNote.trim() : (mov.delivery_note as string),
      project_id: project.project_id,
      site_name: project.site_name,
      depot_id: depot.depot_id,
      destination_depot_id: destDepotId,
      notes: body.notes !== undefined ? body.notes.trim() : (mov.notes as string),
    })
    .eq("id", mov.id)
    .eq("organization_id", organizationId);

  if (updMovErr) return NextResponse.json({ error: updMovErr.message }, { status: 500 });

  try {
    await applyDepotMovementEffect(supabase, organizationId, {
      movement_type: newType,
      qty: newQty,
      item_id: item.id,
      depot_id: depot.depot_id,
      destination_depot_id: destDepotId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Modification refusée" },
      { status: 400 },
    );
  }

  if (newType !== "transfer") {
    adjustedQty = Math.max(0, adjustedQty);
  } else {
    adjustedQty = Number(item.qty ?? 0);
  }

  const { error: updItemErr } = await supabase
    .from("admin_stock_items")
    .update({ qty: adjustedQty, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .eq("organization_id", organizationId);

  if (updItemErr) return NextResponse.json({ error: updItemErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, newQty: adjustedQty });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: mov, error: movErr } = await supabase
    .from("admin_stock_movements")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (movErr || !mov) {
    return NextResponse.json({ error: "Mouvement introuvable" }, { status: 404 });
  }

  if (isTraitementStockMovement(String(mov.notes ?? ""))) {
    return NextResponse.json(
      {
        error:
          "Ce mouvement provient d'un traitement achat/vente. Annulez-le via un bon de retour (BR) dans Traitements.",
      },
      { status: 400 },
    );
  }

  const { data: item, error: itemErr } = await fetchStockItemForMovement(organizationId, mov.item_id as string);

  if (itemErr || !item) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  try {
    await assertNotGasoilStockItem(supabase, organizationId, item.id);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Suppression refusée" },
      { status: 400 },
    );
  }

  const oldDelta = qtyDelta(mov.movement_type as StockMovementType, Number(mov.qty ?? 0));
  let adjustedQty = Number(item.qty ?? 0) - oldDelta;

  try {
    await reverseDepotMovementEffect(supabase, organizationId, mov as {
      movement_type: string;
      qty: number;
      item_id: string;
      depot_id: string | null;
      destination_depot_id: string | null;
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Suppression refusée" },
      { status: 400 },
    );
  }

  if ((mov.movement_type as StockMovementType) === "transfer") {
    adjustedQty = Number(item.qty ?? 0);
  } else {
    adjustedQty = Math.max(0, adjustedQty);
  }

  const { error: delErr } = await supabase
    .from("admin_stock_movements")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { error: updItemErr } = await supabase
    .from("admin_stock_items")
    .update({ qty: adjustedQty, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .eq("organization_id", organizationId);

  if (updItemErr) return NextResponse.json({ error: updItemErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, newQty: adjustedQty });
}
