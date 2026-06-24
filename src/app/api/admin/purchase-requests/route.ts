import { NextResponse } from "next/server";
import type { PurchaseCategory, PurchaseRequestStatus } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import { nextDaNumber } from "@/lib/admin/da-number";
import { getGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import { mapPurchaseRequestRow } from "@/lib/admin/map-purchase-request";
import {
  emptyPurchaseRequestLine,
  purchaseRequestLinesTotal,
  serializePurchaseRequestLines,
  type PurchaseRequestLine,
} from "@/lib/admin/map-purchase-request-lines";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const gasoilOnly = searchParams.get("gasoil") === "1";
  const id = searchParams.get("id");

  let query = getSupabaseAdminClient()
    .from("admin_purchase_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (id) query = query.eq("id", id).limit(1);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (gasoilOnly) query = query.like("number", "DA-GASOIL-%");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => mapPurchaseRequestRow(r as Record<string, unknown>));

  if (id) {
    if (rows.length === 0) return NextResponse.json({ error: "DA introuvable" }, { status: 404 });
    return NextResponse.json(rows[0]);
  }

  if (searchParams.get("format") === "csv") {
    return csvResponse(
      "demandes-achat.csv",
      ["N°", "Catégorie", "Objet", "Montant", "Statut", "Demandeur"],
      rows.map((r) => [
        r.number,
        r.category,
        r.subject,
        String(r.totalAmount),
        r.status,
        r.requester,
      ]),
    );
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    kind?: "gasoil" | "standard";
    category?: PurchaseCategory;
    subject?: string;
    reference?: string;
    designation?: string;
    unit?: string;
    productId?: string;
    qty?: number;
    unitPrice?: number;
    supplier?: string;
    urgency?: string;
    deliveryDate?: string;
    justification?: string;
    requester?: string;
    projectId?: string;
    pumpMeter?: number;
    prefillReference?: string;
    prefillDesignation?: string;
    stockItemId?: string;
    lines?: Array<{
      reference?: string;
      designation?: string;
      unit?: string;
      productId?: string;
      stockItemId?: string;
      qty?: number;
      unitPrice?: number;
    }>;
  };

  function normalizeArticleLines(): PurchaseRequestLine[] {
    if (body.lines && body.lines.length > 0) {
      return body.lines
        .map((l) => ({
          reference: l.reference?.trim() || "",
          designation: l.designation?.trim() || "",
          unit: l.unit?.trim() || "PIECE",
          productId: l.productId?.trim() || null,
          stockItemId: l.stockItemId?.trim() || null,
          qty: Math.max(0, Number(l.qty) || 0),
          unitPrice: Math.max(0, Number(l.unitPrice) || 0),
        }))
        .filter((l) => l.designation || l.reference);
    }
    const designation =
      body.designation?.trim() ||
      body.prefillDesignation?.trim() ||
      "";
    const reference = body.reference?.trim() || body.prefillReference?.trim() || "";
    if (!designation && !reference) return [];
    return [
      {
        reference,
        designation,
        unit: body.unit?.trim() || "PIECE",
        productId: body.productId?.trim() || null,
        stockItemId: body.stockItemId?.trim() || null,
        qty: Math.max(0, Number(body.qty) || 0),
        unitPrice: Math.max(0, Number(body.unitPrice) || 0),
      },
    ];
  }

  const isGasoil = body.kind === "gasoil";
  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId);

  if (isGasoil && !body.projectId) {
    return NextResponse.json({ error: "Chantier requis" }, { status: 400 });
  }
  if (isGasoil && !body.deliveryDate) {
    return NextResponse.json({ error: "Date de livraison requise" }, { status: 400 });
  }
  const qty = Math.max(0, Number(body.qty) || 0);
  if (isGasoil && qty <= 0) {
    return NextResponse.json({ error: "Quantité demandée requise" }, { status: 400 });
  }

  let stockItemId: string | null = body.stockItemId?.trim() || null;
  let stockQtySnapshot: number | null = null;
  if (isGasoil) {
    const gasoil = await getGasoilStockItem(supabase, organizationId);
    if (gasoil) {
      stockItemId = gasoil.id;
      stockQtySnapshot = gasoil.qty;
    }
  }

  const designation =
    body.designation?.trim() ||
    body.prefillDesignation?.trim() ||
    "";
  const reference = body.reference?.trim() || body.prefillReference?.trim() || "";

  const articleLines = isGasoil ? [] : normalizeArticleLines();
  if (!isGasoil && articleLines.length === 0) {
    return NextResponse.json({ error: "Ajoutez au moins un article." }, { status: 400 });
  }
  if (!isGasoil && articleLines.some((l) => l.qty <= 0)) {
    return NextResponse.json({ error: "Quantité requise pour chaque article." }, { status: 400 });
  }

  const primaryLine = articleLines[0] ?? emptyPurchaseRequestLine();

  const subject =
    body.subject?.trim() ||
    (isGasoil
      ? `Gasoil — ${project.site_name || "chantier"}`
      : articleLines.length > 1
        ? `Réappro — ${articleLines.length} articles`
        : primaryLine.designation
          ? `Réappro — ${primaryLine.designation}`
          : primaryLine.reference
            ? `Réappro — ${primaryLine.reference}`
            : designation
              ? `Réappro — ${designation}`
              : reference
                ? `Réappro — ${reference}`
                : "");

  if (!subject) {
    return NextResponse.json({ error: "Objet requis" }, { status: 400 });
  }

  const unitPrice = isGasoil ? 0 : primaryLine.unitPrice;
  const totalAmount = isGasoil ? qty * unitPrice : purchaseRequestLinesTotal(articleLines);
  const number = await nextDaNumber(organizationId, isGasoil ? "gasoil" : "standard");
  const pumpMeter =
    body.pumpMeter != null && !Number.isNaN(Number(body.pumpMeter)) ? Number(body.pumpMeter) : null;

  const { data, error } = await supabase
    .from("admin_purchase_requests")
    .insert({
      id: opsId("da"),
      user_id: userId,
      organization_id: organizationId,
      project_id: project.project_id,
      number,
      category: isGasoil ? "fuel" : body.category || "misc",
      subject,
      reference: isGasoil ? reference : primaryLine.reference,
      designation: isGasoil ? designation || subject : primaryLine.designation || subject,
      unit: isGasoil ? body.unit?.trim() || GASOIL_UNIT : primaryLine.unit,
      product_id: isGasoil ? body.productId?.trim() || null : primaryLine.productId,
      qty: isGasoil ? qty : primaryLine.qty,
      unit_price: unitPrice,
      total_amount: totalAmount,
      lines: isGasoil ? [] : serializePurchaseRequestLines(articleLines),
      supplier: body.supplier?.trim() || "",
      urgency: body.urgency?.trim() || "Normale",
      delivery_date: body.deliveryDate || null,
      justification: body.justification?.trim() || "",
      requester: body.requester?.trim() || "",
      status: "pending",
      pump_meter: pumpMeter,
      stock_item_id: stockItemId,
      stock_qty_snapshot: stockQtySnapshot,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapPurchaseRequestRow(data as Record<string, unknown>));
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { id?: string; status?: PurchaseRequestStatus };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id et status requis" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    status: body.status,
    updated_at: new Date().toISOString(),
  };

  if (body.status === "approved") {
    payload.approved_at = new Date().toISOString();
    payload.approved_by = userId;
  }
  if (body.status === "pending" || body.status === "rejected") {
    payload.approved_at = null;
    payload.approved_by = null;
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_purchase_requests")
    .update(payload)
    .eq("id", body.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapPurchaseRequestRow(data as Record<string, unknown>));
}
