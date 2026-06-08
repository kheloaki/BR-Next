"use client";

import { useState } from "react";
import type { ProjectReportModule } from "@/lib/admin/project-report-types";
import {
  downloadProjectReport,
  isFinancialReportModule,
} from "@/lib/admin/reports/download-project-report";
import { btnPrimary, btnSecondary } from "@/components/admin/admin-form-styles";

type Props = {
  projectId: string;
  module: ProjectReportModule;
  from: string;
  to: string;
  canExport: boolean;
  canFinancial: boolean;
  onError?: (message: string) => void;
};

export function ProjectReportExportButtons({
  projectId,
  module,
  from,
  to,
  canExport,
  canFinancial,
  onError,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  const financialModule = isFinancialReportModule(module);
  const exportBlocked = !canExport || !projectId.trim() || (financialModule && !canFinancial);

  async function run(format: "pdf" | "excel" | "csv" | "html") {
    if (exportBlocked) {
      onError?.(
        !projectId.trim()
          ? "Sélectionnez un projet."
          : financialModule && !canFinancial
            ? "Totaux financiers réservés aux administrateurs."
            : "Export non autorisé.",
      );
      return;
    }
    setBusy(format);
    const result = await downloadProjectReport(projectId, module, format, from, to);
    setBusy(null);
    if (!result.ok) onError?.(result.error);
  }

  const disabledClass = exportBlocked || busy ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${btnPrimary} ${disabledClass}`}
          disabled={Boolean(busy)}
          onClick={() => void run("pdf")}
        >
          {busy === "pdf" ? "PDF…" : "PDF"}
        </button>
        <button
          type="button"
          className={`${btnSecondary} ${disabledClass}`}
          disabled={Boolean(busy)}
          onClick={() => void run("excel")}
        >
          {busy === "excel" ? "Excel…" : "Excel"}
        </button>
        <button
          type="button"
          className={`${btnSecondary} ${disabledClass}`}
          disabled={Boolean(busy)}
          onClick={() => void run("csv")}
        >
          {busy === "csv" ? "CSV…" : "CSV"}
        </button>
        <button
          type="button"
          className={`${btnSecondary} ${disabledClass}`}
          disabled={Boolean(busy)}
          onClick={() => void run("html")}
        >
          {busy === "html" ? "Ouverture…" : "Imprimer"}
        </button>
      </div>
      {exportBlocked ? (
        <p className="text-xs text-[var(--graphite)]/70">
          {!projectId.trim()
            ? "Choisissez un chantier pour exporter."
            : financialModule && !canFinancial
              ? "Cet état financier est réservé aux administrateurs (owner/admin)."
              : "Export non autorisé."}
        </p>
      ) : null}
    </div>
  );
}
