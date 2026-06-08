import { NextResponse } from "next/server";
import { mapReportExportRow } from "@/lib/admin/report-export-log";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { canViewReports } from "@/lib/admin/organization";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const projectId = new URL(request.url).searchParams.get("project");
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("admin_report_exports")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapReportExportRow(r as Record<string, unknown>)));
}
