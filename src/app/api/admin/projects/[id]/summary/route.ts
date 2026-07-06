import { NextResponse } from "next/server";
import { bundleToProjectSummary, fetchProjectReportBundle } from "@/lib/admin/project-reporting";
import {
  canSeeFinancialTotals,
  canViewReports,
} from "@/lib/admin/organization";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { projectReportExportResponse } from "@/lib/admin/reports/project-report-export";
import type { ProjectReportModule } from "@/lib/admin/project-report-types";

const MODULES: ProjectReportModule[] = [
  "global",
  "gasoil",
  "stock",
  "rentals",
  "personnel",
  "production",
  "purchases",
  "facturation",
  "profitability",
];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId, role } = auth;
  const { id } = await context.params;

  if (!canViewReports(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from")?.slice(0, 10) || undefined;
  const to = url.searchParams.get("to")?.slice(0, 10) || undefined;
  const moduleParam = url.searchParams.get("module") as ProjectReportModule | null;
  const module = moduleParam && MODULES.includes(moduleParam) ? moduleParam : undefined;
  const format = url.searchParams.get("format");

  try {
    const bundle = await fetchProjectReportBundle({
      organizationId,
      projectId: id,
      from,
      to,
      module,
    });

    if (!bundle) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    if (format === "csv" || format === "excel" || format === "xls") {
      const mod = module ?? "global";
      const exportFormat = parseExportFormat(format);
      return projectReportExportResponse(mod, bundle, exportFormat);
    }

    const summary = bundleToProjectSummary(bundle);
    if (!canSeeFinancialTotals(role)) {
      summary.purchaseRequests = { ...summary.purchaseRequests, totalAmount: 0 };
      summary.rentals = { ...summary.rentals, totalMad: 0 };
      summary.parts = { ...summary.parts, totalCost: 0 };
      const { reportTotals: _rt, ...rest } = summary;
      return NextResponse.json(rest);
    }
    return NextResponse.json(summary);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
