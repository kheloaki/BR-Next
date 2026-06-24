import { NextResponse } from "next/server";
import { canExportReports, canViewReports } from "@/lib/admin/organization";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { logReportExport } from "@/lib/admin/report-export-log";
import { reportResponse } from "@/lib/admin/reports/report-response";
import { fetchSituationEnginsBundle, situationEnginsToCsv } from "@/lib/admin/situation-engins";
import { situationEnginsFilename, situationEnginsPdfBytes } from "@/lib/admin/situation-engins-pdf";

function parseFormat(raw: string | null) {
  if (!raw || raw === "json") return "json" as const;
  if (raw === "pdf" || raw === "csv") return raw;
  return null;
}

export async function handleSituationEnginsRoute(request: Request, projectId: string) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const url = new URL(request.url);
  const format = parseFormat(url.searchParams.get("format"));
  if (!format) {
    return NextResponse.json({ error: "format must be pdf, csv or json" }, { status: 400 });
  }

  if (format !== "json" && !canExportReports(auth.role)) {
    return NextResponse.json({ error: "Export non autorisé" }, { status: 403 });
  }

  const from = url.searchParams.get("from")?.slice(0, 10) || undefined;
  const to = url.searchParams.get("to")?.slice(0, 10) || undefined;
  const materialId = url.searchParams.get("materialId")?.trim() || undefined;

  try {
    const bundle = await fetchSituationEnginsBundle({
      organizationId: auth.organizationId,
      projectId,
      from,
      to,
      materialId,
    });

    if (!bundle) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    if (format === "json") {
      return NextResponse.json(bundle);
    }

    const filename = situationEnginsFilename(
      bundle.meta.project.code,
      format,
      bundle.meta.enginLabel,
    );

    void logReportExport({
      organizationId: auth.organizationId,
      projectId,
      reportKind: "etat",
      reportModule: "situation_engins",
      reportFormat: format,
      status: "exported",
      periodFrom: from,
      periodTo: to,
      filename,
      generatedBy: auth.userId,
    });

    if (format === "csv") {
      return reportResponse(filename, format, situationEnginsToCsv(bundle));
    }

    return reportResponse(filename, format, await situationEnginsPdfBytes(bundle));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
