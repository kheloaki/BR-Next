import type { SiteReport, SiteReportStatus, SiteReportType } from "@/lib/admin/site-report-types";

export function mapSiteReportRow(r: Record<string, unknown>): SiteReport {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    reportType: r.report_type as SiteReportType,
    number: r.number as string,
    status: r.status as SiteReportStatus,
    reportDate: String(r.report_date ?? "").slice(0, 10),
    periodFrom: r.period_from ? String(r.period_from).slice(0, 10) : null,
    periodTo: r.period_to ? String(r.period_to).slice(0, 10) : null,
    activities: (r.activities as string) || "",
    quantities: (r.quantities as string) || "",
    blockers: (r.blockers as string) || "",
    nextActions: (r.next_actions as string) || "",
    notes: (r.notes as string) || "",
    createdBy: (r.created_by as string) || null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
