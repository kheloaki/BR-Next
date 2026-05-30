import { NextResponse } from "next/server";
import type { PurchaseCategory, PurchaseRequestStatus } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import { nextDaNumber } from "@/lib/admin/da-number";
import { getGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    number: r.number as string,
    category: r.category as PurchaseCategory,
    subject: r.subject as string,
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    supplier: r.supplier as string,
    urgency: r.urgency as string,
    deliveryDate: (r.delivery_date as string) || "",
    justification: r.justification as string,
    requester: r.requester as string,
    status: r.status as PurchaseRequestStatus,
    createdAt: r.created_at as string,
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    stockItemId: (r.stock_item_id as string) || null,
    stockQtyAtRequest: r.stock_qty_snapshot != null ? Number(r.stock_qty_snapshot) : null,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const gasoilOnly = searchParams.get("gasoil") === "1";

  let query = getSupabaseAdminClient()
    .from("admin_purchase_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (gasoilOnly) query = query.like("number", "DA-GASOIL-%");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => mapRow(r as Record<string, unknown>));

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
  };

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

  let stockItemId: string | null = null;
  let stockQtySnapshot: number | null = null;
  if (isGasoil) {
    const gasoil = await getGasoilStockItem(supabase, organizationId);
    if (gasoil) {
      stockItemId = gasoil.id;
      stockQtySnapshot = gasoil.qty;
    }
  }

  const subject =
    body.subject?.trim() ||
    (isGasoil
      ? `Gasoil — ${project.site_name || "chantier"}`
      : body.prefillDesignation
        ? `Réappro — ${body.prefillDesignation}`
        : body.prefillReference
          ? `Réappro — ${body.prefillReference}`
          : "");

  if (!subject) {
    return NextResponse.json({ error: "Objet requis" }, { status: 400 });
  }

  const unitPrice = isGasoil ? 0 : Math.max(0, Number(body.unitPrice) || 0);
  const totalAmount = qty * unitPrice;
  const number = await nextDaNumber(organizationId, isGasoil ? "gasoil" : "standard");
  const pumpMeter =
    body.pumpMeter != null && !Number.isNaN(Number(body.pumpMeter)) ? Number(body.pumpMeter) : null;

  const { data, error } = await supabase
    .from("admin_purchase_requests")
    .insert({
      id: opsId("da"),
      user_id: userId, organization_id: organizationId,
      project_id: project.project_id,
      number,
      category: isGasoil ? "fuel" : body.category || "misc",
      subject,
      qty,
      unit_price: unitPrice,
      total_amount: totalAmount,
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
  return NextResponse.json(mapRow(data as Record<string, unknown>));
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { id?: string; status?: PurchaseRequestStatus };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id et status requis" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_purchase_requests")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data as Record<string, unknown>));
}
