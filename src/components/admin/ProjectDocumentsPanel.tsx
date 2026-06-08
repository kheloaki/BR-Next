"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportExportRow } from "@/lib/admin/report-export-log";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { SITE_PV_TYPE_LABELS } from "@/lib/admin/site-pv-types";
import type { SitePvType } from "@/lib/admin/site-pv-types";
import { SITE_REPORT_TYPE_LABELS } from "@/lib/admin/site-report-types";
import type { SiteReportType } from "@/lib/admin/site-report-types";
import { btnSecondary, rowHover, tdClass, thClass } from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";

function labelForExport(row: ReportExportRow) {
  if (row.reportKind === "etat" && row.reportModule) {
    const mod = row.reportModule as keyof typeof REPORT_MODULE_LABELS;
    return REPORT_MODULE_LABELS[mod] ?? row.reportModule;
  }
  if (row.reportKind === "pv" && row.reportModule) {
    return SITE_PV_TYPE_LABELS[row.reportModule as SitePvType] ?? row.reportModule;
  }
  if (row.reportKind === "rapport" && row.reportModule) {
    return SITE_REPORT_TYPE_LABELS[row.reportModule as SiteReportType] ?? row.reportModule;
  }
  return row.reportKind === "etat" ? "État projet" : row.reportKind === "pv" ? "Procès-verbal" : "Rapport chantier";
}

function regenerateHref(row: ReportExportRow, projectId: string) {
  if (row.reportKind !== "etat" || !row.reportModule) return null;
  const p = new URLSearchParams();
  p.set("format", row.reportFormat === "excel" ? "excel" : row.reportFormat);
  if (row.periodFrom) p.set("from", row.periodFrom);
  if (row.periodTo) p.set("to", row.periodTo);
  return `/api/admin/projects/${projectId}/reports/${row.reportModule}?${p.toString()}`;
}

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ReportExportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/report-exports?project=${encodeURIComponent(projectId)}`, {
      cache: "no-store",
    });
    if (res.ok) setRows((await res.json()) as ReportExportRow[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <AdminLoading />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--graphite)]/75">
        Archives des exports PDF, Excel, CSV et impressions générés pour ce chantier.
      </p>
      <AdminInventoryCard title={`Documents exportés (${rows.length})`}>
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--graphite)]/70">
            Aucun export enregistré — générez un état, un PV ou un rapport pour alimenter l&apos;archive.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Format</th>
                <th className={thClass}>Période</th>
                <th className={thClass}>Fichier</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const regen = regenerateHref(row, projectId);
                return (
                  <tr key={row.id} className={rowHover}>
                    <td className={tdClass}>{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td className={tdClass}>{labelForExport(row)}</td>
                    <td className={tdClass}>{row.reportFormat.toUpperCase()}</td>
                    <td className={tdClass}>
                      {row.periodFrom || row.periodTo
                        ? `${row.periodFrom ?? "…"} → ${row.periodTo ?? "…"}`
                        : "—"}
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>{row.filename}</td>
                    <td className={tdClass}>
                      {regen ? (
                        <a href={regen} className={btnSecondary} target="_blank" rel="noopener noreferrer">
                          Regénérer
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
      <button type="button" className={btnSecondary} onClick={() => void load()}>
        Actualiser
      </button>
    </div>
  );
}

export function ProjectHistoryPanel({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<ReportExportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/admin/report-exports?project=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });
      if (res.ok) setRows((await res.json()) as ReportExportRow[]);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) return <AdminLoading />;

  const KIND_LABELS = { etat: "État", pv: "PV", rapport: "Rapport" } as const;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--graphite)]/75">Historique chronologique des générations documentaires.</p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--graphite)]/70">Aucun événement documentaire.</p>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-4 pl-6">
          {rows.map((row) => (
            <li key={row.id} className="text-sm">
              <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
              <p className="text-xs text-[var(--graphite)]/60">{row.createdAt.slice(0, 16).replace("T", " ")}</p>
              <p className="font-medium text-[var(--navy)]">
                {KIND_LABELS[row.reportKind]} — {labelForExport(row)} ({row.reportFormat.toUpperCase()})
              </p>
              <p className="text-[var(--graphite)]/75">{row.filename}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
