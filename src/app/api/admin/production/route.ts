import { NextResponse } from "next/server";
import { csvResponse } from "@/lib/admin/csv-response";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    entryDate: r.entry_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    tonnage: Number(r.tonnage ?? 0),
    targetTonnage: Number(r.target_tonnage ?? 0),
    material: r.material as string,
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    stopReason: r.stop_reason as string,
    shippedTonnage: Number(r.shipped_tonnage ?? 0),
    stockTonnage: Number(r.stock_tonnage ?? 0),
    shiftLead: r.shift_lead as string,
    notes: r.notes as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_production_entries")
    .select("*")
    .eq("organization_id", organizationId)
    .order("entry_date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return csvResponse(
      "production.csv",
      ["Date", "Chantier", "Tonnage", "Cible", "Matériau"],
      rows.map((r) => [
        r.entryDate,
        r.siteName,
        String(r.tonnage),
        String(r.targetTonnage),
        r.material,
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
  const project = await resolveProjectFields(supabase, organizationId, body.projectId as string);

  const { data, error } = await supabase.from("admin_production_entries").insert({
      id: opsId("prod"),
      user_id: userId, organization_id: organizationId,
      entry_date: (body.entryDate as string) || new Date().toISOString().slice(0, 10),
      project_id: project.project_id,
      site_name: project.site_name,
      tonnage: Number(body.tonnage) || 0,
      target_tonnage: Number(body.targetTonnage) || 0,
      material: String(body.material || "").trim(),
      run_hours: Number(body.runHours) || 0,
      stop_hours: Number(body.stopHours) || 0,
      stop_reason: String(body.stopReason || "").trim(),
      shipped_tonnage: Number(body.shippedTonnage) || 0,
      stock_tonnage: Number(body.stockTonnage) || 0,
      shift_lead: String(body.shiftLead || "").trim(),
      notes: String(body.notes || "").trim(),
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
    .from("admin_production_entries")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
