import { NextResponse } from "next/server";
import { csvResponse } from "@/lib/admin/csv-response";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    entryDate: r.entry_date as string,
    litres: Number(r.litres ?? 0),
    meterStart: r.meter_start != null ? Number(r.meter_start) : null,
    meterEnd: r.meter_end != null ? Number(r.meter_end) : null,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    fueledBy: r.fueled_by as string,
    ticketNo: r.ticket_no as string,
    notes: r.notes as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_fuel_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .order("entry_date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return csvResponse(
      "carburant.csv",
      ["Date", "Engin", "Litres", "Site", "Ticket"],
      rows.map((r) => [r.entryDate, r.equipmentName, String(r.litres), r.siteName, r.ticketNo]),
    );
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    equipmentId?: string;
    equipmentName?: string;
    entryDate?: string;
    litres?: number;
    meterStart?: number;
    meterEnd?: number;
    siteName?: string;
    projectId?: string;
    fueledBy?: string;
    ticketNo?: string;
    notes?: string;
  };

  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(supabase, organizationId, body.projectId);

  const { data, error } = await supabase.from("admin_fuel_entries").insert({
      id: opsId("fuel"),
      user_id: userId, organization_id: organizationId,
      equipment_id: body.equipmentId || null,
      equipment_name: body.equipmentName?.trim() || "",
      entry_date: body.entryDate || new Date().toISOString().slice(0, 10),
      litres: Math.max(0, Number(body.litres) || 0),
      meter_start: body.meterStart ?? null,
      meter_end: body.meterEnd ?? null,
      project_id: project.project_id,
      site_name: project.site_name,
      fueled_by: body.fueledBy?.trim() || "",
      ticket_no: body.ticketNo?.trim() || "",
      notes: body.notes?.trim() || "",
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
    .from("admin_fuel_entries")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
