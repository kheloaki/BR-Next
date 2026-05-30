import { NextResponse } from "next/server";
import { csvResponse } from "@/lib/admin/csv-response";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  const depthStart = Number(r.depth_start ?? 0);
  const depthEnd = Number(r.depth_end ?? 0);
  return {
    id: r.id as string,
    reportDate: r.report_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    rigName: r.rig_name as string,
    operatorName: r.operator_name as string,
    depthStart,
    depthEnd,
    metersDrilled: Math.max(0, depthEnd - depthStart),
    targetMeters: Number(r.target_meters ?? 0),
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    diameterMm: r.diameter_mm != null ? Number(r.diameter_mm) : null,
    incidents: r.incidents as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_drilling_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("report_date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return csvResponse(
      "foration.csv",
      ["Date", "Chantier", "Foreuse", "Mètres", "Cible"],
      rows.map((r) => [
        r.reportDate,
        r.siteName,
        r.rigName,
        String(r.metersDrilled),
        String(r.targetMeters),
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

  const { data, error } = await supabase.from("admin_drilling_reports").insert({
      id: opsId("drill"),
      user_id: userId, organization_id: organizationId,
      report_date: (body.reportDate as string) || new Date().toISOString().slice(0, 10),
      project_id: project.project_id,
      site_name: project.site_name,
      rig_name: String(body.rigName || "").trim(),
      operator_name: String(body.operatorName || "").trim(),
      depth_start: Number(body.depthStart) || 0,
      depth_end: Number(body.depthEnd) || 0,
      target_meters: Number(body.targetMeters) || 60,
      run_hours: Number(body.runHours) || 0,
      stop_hours: Number(body.stopHours) || 0,
      diameter_mm: body.diameterMm != null ? Number(body.diameterMm) : null,
      incidents: String(body.incidents || "").trim(),
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
    .from("admin_drilling_reports")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
