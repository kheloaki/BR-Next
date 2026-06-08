import type { ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { todayStamp } from "@/lib/admin/reports/report-formatters";

export function projectReportFilename(
  projectCode: string | null | undefined,
  module: ProjectReportModule,
  ext: "pdf" | "xls" | "csv" | "html",
) {
  const code = (projectCode || "PROJ").replace(/[^\w-]+/g, "-").toUpperCase();
  const slug = module.replace(/_/g, "-");
  const label = REPORT_MODULE_LABELS[module]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${code}_${label}_${todayStamp()}.${ext}`;
}
