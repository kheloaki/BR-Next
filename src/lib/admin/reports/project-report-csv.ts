import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { row } from "@/lib/admin/reports/report-formatters";
import {
  buildProjectReportTables,
  tableToCsv,
} from "@/lib/admin/reports/project-report-tables";

function metaCsv(bundle: ProjectReportBundle): string {
  const p = bundle.meta.project;
  return tableToCsv({
    headers: ["Champ", "Valeur"],
    rows: [
      row("Chantier", p.name),
      row("Code", p.code || "—"),
      row("Client", p.clientName || "—"),
      row("Marché", p.marketNumber || "—"),
      row("Période", bundle.meta.periodLabel),
      row("Statut", p.status),
      row("Responsable", p.managerName || "—"),
    ],
  });
}

export function buildProjectReportCsv(module: ProjectReportModule, bundle: ProjectReportBundle): string {
  const tables = buildProjectReportTables(module, bundle);
  const blocks = tables.map((t) => tableToCsv(t));
  if (module === "global") {
    return [metaCsv(bundle), ...blocks].join("\n\n");
  }
  return blocks.join("\n\n");
}

export function projectReportCsvTitle(module: ProjectReportModule): string {
  return REPORT_MODULE_LABELS[module];
}
