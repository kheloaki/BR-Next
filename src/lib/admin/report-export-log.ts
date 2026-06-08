import type { ProjectReportFormat, ProjectReportModule } from "@/lib/admin/project-report-types";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ReportExportKind = "etat" | "pv" | "rapport";
export type ReportExportStatus = "draft" | "generated" | "exported";

export type LogReportExportParams = {
  organizationId: string;
  projectId?: string | null;
  reportKind: ReportExportKind;
  reportModule?: ProjectReportModule | string | null;
  reportFormat: ProjectReportFormat | string;
  status?: ReportExportStatus;
  periodFrom?: string | null;
  periodTo?: string | null;
  filename: string;
  generatedBy?: string | null;
};

export async function logReportExport(params: LogReportExportParams) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_report_exports").insert({
    id: opsId("rex"),
    organization_id: params.organizationId,
    project_id: params.projectId?.trim() || null,
    report_kind: params.reportKind,
    report_module: params.reportModule?.trim() || null,
    report_format: params.reportFormat,
    status: params.status ?? "exported",
    period_from: params.periodFrom?.slice(0, 10) || null,
    period_to: params.periodTo?.slice(0, 10) || null,
    filename: params.filename,
    generated_by: params.generatedBy?.trim() || null,
  });
  if (error) console.error("[report-export-log]", error.message);
}

export type ReportExportRow = {
  id: string;
  projectId: string | null;
  reportKind: ReportExportKind;
  reportModule: string | null;
  reportFormat: string;
  status: ReportExportStatus;
  periodFrom: string | null;
  periodTo: string | null;
  filename: string;
  generatedBy: string | null;
  createdAt: string;
};

export function mapReportExportRow(r: Record<string, unknown>): ReportExportRow {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    reportKind: r.report_kind as ReportExportKind,
    reportModule: (r.report_module as string) || null,
    reportFormat: r.report_format as string,
    status: r.status as ReportExportStatus,
    periodFrom: r.period_from ? String(r.period_from).slice(0, 10) : null,
    periodTo: r.period_to ? String(r.period_to).slice(0, 10) : null,
    filename: (r.filename as string) || "",
    generatedBy: (r.generated_by as string) || null,
    createdAt: r.created_at as string,
  };
}
