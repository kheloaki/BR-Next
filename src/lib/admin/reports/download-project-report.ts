import type { ProjectReportModule } from "@/lib/admin/project-report-types";

export function buildProjectReportApiUrl(
  projectId: string,
  module: ProjectReportModule,
  format: "pdf" | "excel" | "csv" | "html",
  from?: string,
  to?: string,
  extra?: { materialId?: string },
) {
  const p = new URLSearchParams();
  p.set("format", format);
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (extra?.materialId) p.set("materialId", extra.materialId);
  if (format === "html") p.set("print", "1");
  return `/api/admin/projects/${encodeURIComponent(projectId)}/reports/${encodeURIComponent(module)}?${p.toString()}`;
}

function filenameFromDisposition(header: string | null, fallback: string) {
  if (!header) return fallback;
  const m = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"/i.exec(header);
  const raw = m?.[1] ?? m?.[2];
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Download report via fetch (session cookies) — reliable with Clerk auth. */
export async function downloadProjectReport(
  projectId: string,
  module: ProjectReportModule,
  format: "pdf" | "excel" | "csv" | "html",
  from?: string,
  to?: string,
  extra?: { materialId?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!projectId.trim()) {
    return { ok: false, error: "Sélectionnez un projet." };
  }

  const url = buildProjectReportApiUrl(projectId, module, format, from, to, extra);

  if (format === "html") {
    window.open(url, "_blank", "noopener,noreferrer");
    return { ok: true };
  }

  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    let error = `Export impossible (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) error = body.error;
    } catch {
      // non-json body
    }
    return { ok: false, error };
  }

  const blob = await res.blob();
  const ext = format === "excel" ? "xls" : format;
  const fallback = `etat-${module}.${ext}`;
  const filename = filenameFromDisposition(res.headers.get("Content-Disposition"), fallback);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return { ok: true };
}

export function isFinancialReportModule(module: ProjectReportModule) {
  return module === "purchases" || module === "facturation" || module === "profitability";
}
