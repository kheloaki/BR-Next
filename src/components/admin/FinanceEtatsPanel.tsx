"use client";

import { useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { btnPrimary, btnSecondary, inputClass, labelClass, moduleWrap } from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { appendExportFormat } from "@/lib/admin/admin-csv-export";

const REPORTS = [
  { kind: "journal_caisse", label: "Journal caisse" },
  { kind: "journal_banque", label: "Journal banque" },
  { kind: "tresorerie", label: "Trésorerie générale" },
  { kind: "balance_clients", label: "Balance clients" },
  { kind: "balance_fournisseurs", label: "Balance fournisseurs" },
  { kind: "impayes_clients", label: "Impayés clients" },
  { kind: "dettes_fournisseurs", label: "Dettes fournisseurs" },
  { kind: "encaissements", label: "Encaissements période" },
  { kind: "decaissements", label: "Décaissements période" },
  { kind: "depenses_categorie", label: "Dépenses par catégorie" },
  { kind: "situation_mensuelle", label: "Situation mensuelle" },
  { kind: "cheques", label: "État des chèques" },
  { kind: "virements", label: "État des virements" },
] as const;

export function FinanceEtatsPanel() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState<{ title: string; rows?: Record<string, unknown>[] } | null>(null);

  async function loadPreview(kind: string) {
    const qs = new URLSearchParams({ kind, from, to });
    const res = await fetch(`/api/admin/finance/reports?${qs}`, { cache: "no-store" });
    if (res.ok) setPreview(await res.json());
  }

  function exportBase(kind: string) {
    const qs = new URLSearchParams({ kind, from, to });
    return `/api/admin/finance/reports?${qs}`;
  }

  function openExport(kind: string, format: "csv" | "excel") {
    window.open(appendExportFormat(exportBase(kind), format), "_blank");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="États finance"
        description="Rapports Sage-like — export CSV ou Excel (séparateur point-virgule, format français)."
      />

      <AdminFormCard title="Période">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <p className={labelClass}>Du</p>
            <input type="date" className={`${inputClass} mt-1`} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <p className={labelClass}>Au</p>
            <input type="date" className={`${inputClass} mt-1`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </AdminFormCard>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {REPORTS.map((r) => (
          <div key={r.kind} className="rounded-md border border-border bg-white p-3 flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--navy)]">{r.label}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => void loadPreview(r.kind)}>
                Aperçu
              </button>
              <button type="button" className={btnPrimary} onClick={() => openExport(r.kind, "csv")}>
                CSV
              </button>
              <button type="button" className={btnSecondary} onClick={() => openExport(r.kind, "excel")}>
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview ? (
        <div className="mt-6 rounded-md border border-border bg-white p-4 overflow-auto max-h-[400px]">
          <p className="font-medium mb-2">{preview.title}</p>
          <pre className="text-xs">{JSON.stringify(preview, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
