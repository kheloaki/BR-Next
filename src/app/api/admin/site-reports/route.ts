import { NextResponse } from "next/server";
import type { SiteReportStatus, SiteReportType } from "@/lib/admin/site-report-types";
import { SITE_REPORT_TYPES } from "@/lib/admin/site-report-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { siteReportsListCsv } from "@/lib/admin/referential-csv-export";
import { mapSiteReportRow } from "@/lib/admin/map-site-report";
import { nextSiteReportNumber } from "@/lib/admin/site-report-number";
import { siteReportPdfBytes, siteReportPdfFilename } from "@/lib/admin/site-report-pdf";
import { logReportExport } from "@/lib/admin/report-export-log";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const STATUSES: SiteReportStatus[] = ["draft", "submitted", "validated", "archived"];

async function loadProjectName(supabase: ReturnType<typeof getSupabaseAdminClient>, projectId: string | null) {
  if (!projectId) return undefined;
  const { data } = await supabase.from("admin_projects").select("name").eq("id", projectId).maybeSingle();
  return data?.name as string | undefined;
}

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId, userId } = auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const projectId = url.searchParams.get("project");
  const format = url.searchParams.get("format");

  const supabase = getSupabaseAdminClient();

  if (id && format === "pdf") {
    const { data, error } = await supabase
      .from("admin_site_reports")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });
    const report = mapSiteReportRow(data as Record<string, unknown>);
    const projectName = await loadProjectName(supabase, report.projectId);
    const filename = siteReportPdfFilename(report.number);
    void logReportExport({
      organizationId,
      projectId: report.projectId,
      reportKind: "rapport",
      reportModule: report.reportType,
      reportFormat: "pdf",
      periodFrom: report.periodFrom,
      periodTo: report.periodTo,
      filename,
      generatedBy: userId,
    });
    const bytes = siteReportPdfBytes(report, projectName);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  let query = supabase
    .from("admin_site_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("report_date", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => mapSiteReportRow(r as Record<string, unknown>));
  if (format === "csv" || format === "excel" || format === "xls") {
    return siteReportsListCsv(rows, {
      projectId: projectId ?? undefined,
      format: parseExportFormat(format),
    });
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const body = (await request.json()) as {
    id?: string;
    projectId?: string | null;
    reportType?: SiteReportType;
    status?: SiteReportStatus;
    reportDate?: string;
    periodFrom?: string | null;
    periodTo?: string | null;
    activities?: string;
    quantities?: string;
    blockers?: string;
    nextActions?: string;
    notes?: string;
  };

  const reportType =
    body.reportType && SITE_REPORT_TYPES.includes(body.reportType) ? body.reportType : "journalier";
  const status = body.status && STATUSES.includes(body.status) ? body.status : "draft";

  const payload = {
    project_id: body.projectId?.trim() || null,
    report_type: reportType,
    status,
    report_date: body.reportDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    period_from: body.periodFrom?.slice(0, 10) || null,
    period_to: body.periodTo?.slice(0, 10) || null,
    activities: body.activities?.trim() || "",
    quantities: body.quantities?.trim() || "",
    blockers: body.blockers?.trim() || "",
    next_actions: body.nextActions?.trim() || "",
    notes: body.notes?.trim() || "",
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const editId = body.id?.trim();

  if (editId) {
    const { data, error } = await supabase
      .from("admin_site_reports")
      .update(payload)
      .eq("id", editId)
      .eq("organization_id", organizationId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapSiteReportRow(data as Record<string, unknown>));
  }

  const id = opsId("srp");
  const number = await nextSiteReportNumber(organizationId);
  const { data, error } = await supabase
    .from("admin_site_reports")
    .insert({
      id,
      organization_id: organizationId,
      number,
      created_by: userId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapSiteReportRow(data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_site_reports")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
