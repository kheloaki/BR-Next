import {
  adminSectionsResponse,
  type AdminCsvMeta,
  type AdminExportFormat,
} from "@/lib/admin/admin-csv-export";
import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { buildProjectReportTables } from "@/lib/admin/reports/project-report-tables";

const ORG_NAME = "BARANE INVEST";

function projectMeta(bundle: ProjectReportBundle, module: ProjectReportModule): AdminCsvMeta {
  const p = bundle.meta.project;
  return {
    title: `BARANE INVEST — ${REPORT_MODULE_LABELS[module]}`,
    organization: ORG_NAME,
    period: bundle.meta.periodLabel,
    filters: [
      { label: "Chantier", value: p.name },
      { label: "Code", value: p.code || "—" },
      { label: "Client", value: p.clientName || "—" },
      { label: "Marché", value: p.marketNumber || "—" },
      { label: "Statut", value: p.status },
      { label: "Responsable", value: p.managerName || "—" },
    ],
  };
}

export function projectReportExportResponse(
  module: ProjectReportModule,
  bundle: ProjectReportBundle,
  format: AdminExportFormat,
) {
  const p = bundle.meta.project;
  const sections = buildProjectReportTables(module, bundle).map((table) => ({
    title: table.title,
    headers: table.headers,
    rows: table.rows,
  }));

  return adminSectionsResponse(
    `projet-${p.code || p.id}-${module}`,
    projectMeta(bundle, module),
    sections,
    format,
  );
}
