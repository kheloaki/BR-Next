import { NextResponse } from "next/server";
import { fetchProjectReportBundle } from "@/lib/admin/project-reporting";
import type { ProjectReportFormat, ProjectReportModule } from "@/lib/admin/project-report-types";
import {
  canExportReports,
  canSeeFinancialTotals,
  canViewReports,
} from "@/lib/admin/organization";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { buildProjectReportCsv } from "@/lib/admin/reports/project-report-csv";
import { projectReportExcelBytes } from "@/lib/admin/reports/project-report-excel";
import { buildProjectReportHtml } from "@/lib/admin/reports/project-report-html";
import { projectReportPdfBytes } from "@/lib/admin/reports/project-report-pdf";
import { projectReportFilename } from "@/lib/admin/reports/project-report-filename";
import { reportResponse } from "@/lib/admin/reports/report-response";
import { logReportExport } from "@/lib/admin/report-export-log";

const FINANCIAL_MODULES: ProjectReportModule[] = ["purchases", "facturation", "profitability"];

function parseFormat(raw: string | null): ProjectReportFormat | null {
  if (!raw || raw === "json") return "json";
  if (raw === "pdf" || raw === "excel" || raw === "csv" || raw === "html") return raw;
  return null;
}

export async function handleProjectReportRoute(
  request: Request,
  projectId: string,
  module: ProjectReportModule,
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get("format"));
  if (!format) {
    return NextResponse.json({ error: "format must be pdf, excel, csv, html or json" }, { status: 400 });
  }

  if (format !== "json" && !canExportReports(auth.role)) {
    return NextResponse.json({ error: "Export non autorisé" }, { status: 403 });
  }

  if (FINANCIAL_MODULES.includes(module) && !canSeeFinancialTotals(auth.role)) {
    return NextResponse.json({ error: "Totaux financiers non autorisés" }, { status: 403 });
  }

  const from = url.searchParams.get("from")?.slice(0, 10) || undefined;
  const to = url.searchParams.get("to")?.slice(0, 10) || undefined;

  try {
    const bundle = await fetchProjectReportBundle({
      organizationId: auth.organizationId,
      projectId,
      from,
      to,
      module,
    });

    if (!bundle) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    if (format === "json") {
      return NextResponse.json(bundle);
    }

    const ext = format === "excel" ? "xls" : format;
    const filename = projectReportFilename(bundle.meta.project.code, module, ext);

    void logReportExport({
      organizationId: auth.organizationId,
      projectId,
      reportKind: "etat",
      reportModule: module,
      reportFormat: format,
      status: "exported",
      periodFrom: from,
      periodTo: to,
      filename,
      generatedBy: auth.userId,
    });

    if (format === "csv") {
      return reportResponse(filename, format, buildProjectReportCsv(module, bundle));
    }
    if (format === "excel") {
      return reportResponse(filename, format, projectReportExcelBytes(module, bundle));
    }
    if (format === "html") {
      return reportResponse(filename, format, buildProjectReportHtml(module, bundle));
    }
    return reportResponse(filename, format, await projectReportPdfBytes(module, bundle));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
