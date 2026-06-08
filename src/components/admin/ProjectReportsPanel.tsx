"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { btnSecondary, inputClass } from "@/components/admin/admin-form-styles";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { ProjectReportExportButtons } from "@/components/admin/ProjectReportExportButtons";

type ReportPreview = {
  project: { name: string; code: string | null; startDate: string | null };
  fuel: { totalLitres: number; entryCount: number };
  production: { totalTonnage: number; entryCount: number };
  drilling: { totalMeters: number; entryCount: number };
  attendance: { presentCount: number; entryCount: number };
  parts: { totalCost: number; entryCount: number };
  trips: { totalKm: number; entryCount: number };
  purchaseRequests: { pendingCount: number; totalAmount: number; entryCount: number };
  rentals: { totalMad: number; entryCount: number };
  stock: { movementCount: number };
  reportTotals?: {
    facturationHt: number;
    profitability: { costs: number; revenue: number; margin: number; marginPct: number };
  };
};

const MODULES: { id: ProjectReportModule; label: string }[] = [
  { id: "global", label: REPORT_MODULE_LABELS.global },
  { id: "gasoil", label: REPORT_MODULE_LABELS.gasoil },
  { id: "stock", label: REPORT_MODULE_LABELS.stock },
  { id: "rentals", label: REPORT_MODULE_LABELS.rentals },
  { id: "personnel", label: REPORT_MODULE_LABELS.personnel },
  { id: "purchases", label: REPORT_MODULE_LABELS.purchases },
  { id: "facturation", label: REPORT_MODULE_LABELS.facturation },
  { id: "profitability", label: REPORT_MODULE_LABELS.profitability },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ProjectReportsPanel({
  projectId,
  defaultModule,
}: {
  projectId: string;
  defaultModule?: ProjectReportModule;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayIso());
  const [module, setModule] = useState<ProjectReportModule>(defaultModule ?? "global");
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canExport, setCanExport] = useState(true);
  const [canFinancial, setCanFinancial] = useState(false);
  const [exportError, setExportError] = useState("");

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    return p.toString();
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const qs = query ? `?${query}` : "";
    const [summaryRes, ctxRes] = await Promise.all([
      fetch(`/api/admin/projects/${projectId}/summary${qs}`, { cache: "no-store" }),
      fetch("/api/admin/organization/context", { cache: "no-store" }),
    ]);
    if (!summaryRes.ok) {
      setError("Impossible de charger l'aperçu.");
      setPreview(null);
    } else {
      const data = (await summaryRes.json()) as ReportPreview;
      setPreview(data);
    }
    if (ctxRes.ok) {
      const ctx = (await ctxRes.json()) as {
        canExportReports?: boolean;
        canSeeFinancialTotals?: boolean;
      };
      setCanExport(ctx.canExportReports ?? true);
      setCanFinancial(ctx.canSeeFinancialTotals ?? false);
    }
    setLoading(false);
  }, [projectId, query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (preview?.project?.startDate && !from) {
      setFrom(preview.project.startDate.slice(0, 10));
    }
  }, [preview, from]);

  if (loading && !preview) return <AdminLoading />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--graphite)]/75">Du</span>
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--graphite)]/75">Au</span>
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-[var(--graphite)]/75">État</span>
          <select className={inputClass} value={module} onChange={(e) => setModule(e.target.value as ProjectReportModule)}>
            {MODULES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ProjectReportExportButtons
        projectId={projectId}
        module={module}
        from={from}
        to={to}
        canExport={canExport}
        canFinancial={canFinancial}
        onError={setExportError}
      />
      <button type="button" className={`${btnSecondary} mt-2`} onClick={() => void load()}>
        Actualiser
      </button>

      {exportError ? <p className="text-sm text-red-700">{exportError}</p> : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {preview ? (
        <AdminMiniStats
          items={[
            { label: "Litres gasoil", value: `${preview.fuel.totalLitres.toLocaleString("fr-MA")} L` },
            { label: "Présences RH", value: String(preview.attendance.presentCount) },
            { label: "Location (MAD)", value: preview.rentals.totalMad.toLocaleString("fr-MA") },
            { label: "DA", value: String(preview.purchaseRequests.entryCount) },
            ...(canFinancial && preview.reportTotals
              ? [
                  { label: "Ventes HT", value: preview.reportTotals.facturationHt.toLocaleString("fr-MA") },
                  {
                    label: "Marge",
                    value: `${preview.reportTotals.profitability.margin.toLocaleString("fr-MA")} (${preview.reportTotals.profitability.marginPct.toLocaleString("fr-MA")} %)`,
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </div>
  );
}
