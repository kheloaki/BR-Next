import { NextResponse } from "next/server";
import type { TripStatus } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    tripDate: r.trip_date as string,
    vehicleCode: r.vehicle_code as string,
    plate: r.plate as string,
    driverName: r.driver_name as string,
    departure: r.departure as string,
    destination: r.destination as string,
    loadType: r.load_type as string,
    distanceKm: Number(r.distance_km ?? 0),
    deliveryNote: r.delivery_note as string,
    status: r.status as TripStatus,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_trips")
    .select("*")
    .eq("organization_id", organizationId)
    .order("trip_date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return csvResponse(
      "logistique-voyages.csv",
      ["Date", "Véhicule", "Chauffeur", "Départ", "Destination", "Km", "Statut"],
      rows.map((r) => [
        r.tripDate,
        r.vehicleCode,
        r.driverName,
        r.departure,
        r.destination,
        String(r.distanceKm),
        r.status,
      ]),
    );
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as Record<string, unknown>;
  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(
    supabase,
    organizationId,
    body.projectId as string | undefined,
  );

  const { data, error } = await supabase
    .from("admin_trips")
    .insert({
      id: opsId("trip"),
      user_id: userId, organization_id: organizationId,
      project_id: project.project_id,
      trip_date: (body.tripDate as string) || new Date().toISOString().slice(0, 10),
      vehicle_code: String(body.vehicleCode || "").trim(),
      plate: String(body.plate || "").trim(),
      driver_name: String(body.driverName || "").trim(),
      departure: String(body.departure || "").trim(),
      destination: String(body.destination || "").trim(),
      load_type: String(body.loadType || "").trim(),
      distance_km: Number(body.distanceKm) || 0,
      delivery_note: String(body.deliveryNote || "").trim(),
      status: (body.status as TripStatus) || "delivered",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_trips")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
