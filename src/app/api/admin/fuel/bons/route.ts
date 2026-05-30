import { NextResponse } from "next/server";
import type { GasoilBonType, GasoilVehicleCategory } from "@/components/admin/operations-types";
import { nextBonGasoilNumber } from "@/lib/admin/bon-gasoil-number";
import { GASOIL_BON_TYPES, GASOIL_VEHICLE_CATEGORIES } from "@/lib/admin/gasoil-bon";
import { applyGasoilStockForBon } from "@/lib/admin/gasoil-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    number: r.number as string,
    bonType: r.bon_type as GasoilBonType,
    vehicleCategory: r.vehicle_category as GasoilVehicleCategory,
    projectId: (r.project_id as string) || null,
    equipmentId: (r.equipment_id as string) || null,
    vehicleLabel: (r.vehicle_label as string) || "",
    equipmentName: (r.equipment_name as string) || "",
    siteName: (r.site_name as string) || "",
    bonDate: r.bon_date as string,
    litres: Number(r.litres ?? 0),
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    supplier: (r.supplier as string) || "",
    beneficiary: (r.beneficiary as string) || "",
    deliveryNote: (r.delivery_note as string) || "",
    notes: (r.notes as string) || "",
    createdAt: r.created_at as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const bonType = searchParams.get("bonType");
  const vehicleCategory = searchParams.get("vehicleCategory");

  let query = getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .select("*")
    .eq("organization_id", organizationId)
    .order("bon_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (bonType && GASOIL_BON_TYPES.includes(bonType as GasoilBonType)) {
    query = query.eq("bon_type", bonType);
  }
  if (vehicleCategory && GASOIL_VEHICLE_CATEGORIES.includes(vehicleCategory as GasoilVehicleCategory)) {
    query = query.eq("vehicle_category", vehicleCategory);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    bonType?: GasoilBonType;
    vehicleCategory?: GasoilVehicleCategory;
    projectId?: string;
    equipmentId?: string;
    equipmentName?: string;
    vehicleLabel?: string;
    bonDate?: string;
    litres?: number;
    pumpMeter?: number;
    supplier?: string;
    beneficiary?: string;
    deliveryNote?: string;
    notes?: string;
    syncStock?: boolean;
  };

  if (!body.bonType || !GASOIL_BON_TYPES.includes(body.bonType)) {
    return NextResponse.json({ error: "Type de bon requis (achat ou sortie)" }, { status: 400 });
  }
  if (!body.vehicleCategory || !GASOIL_VEHICLE_CATEGORIES.includes(body.vehicleCategory)) {
    return NextResponse.json({ error: "Catégorie véhicule requise" }, { status: 400 });
  }
  if (!body.projectId) {
    return NextResponse.json({ error: "Chantier requis" }, { status: 400 });
  }

  const litres = Math.max(0, Number(body.litres) || 0);
  if (litres <= 0) {
    return NextResponse.json({ error: "Quantité en litres requise" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId);
  const number = await nextBonGasoilNumber(organizationId, body.bonType);
  const pumpMeter =
    body.pumpMeter != null && !Number.isNaN(Number(body.pumpMeter)) ? Number(body.pumpMeter) : null;

  const syncStock = body.syncStock !== false;

  try {
    if (syncStock) {
      await applyGasoilStockForBon(supabase, organizationId, userId, {
        bonType: body.bonType,
        litres,
        projectId: body.projectId,
        deliveryNote: body.deliveryNote,
        supplier: body.supplier,
        beneficiary: body.beneficiary,
        bonNumber: number,
      });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Mise à jour stock impossible" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("admin_gasoil_bons")
    .insert({
      id: opsId("bon"),
      user_id: userId, organization_id: organizationId,
      number,
      bon_type: body.bonType,
      vehicle_category: body.vehicleCategory,
      project_id: project.project_id,
      equipment_id: body.equipmentId || null,
      vehicle_label: body.vehicleLabel?.trim() || "",
      equipment_name: body.equipmentName?.trim() || "",
      site_name: project.site_name,
      bon_date: body.bonDate || new Date().toISOString().slice(0, 10),
      litres,
      pump_meter: pumpMeter,
      supplier: body.supplier?.trim() || "",
      beneficiary: body.beneficiary?.trim() || "",
      delivery_note: body.deliveryNote?.trim() || "",
      notes: body.notes?.trim() || "",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
