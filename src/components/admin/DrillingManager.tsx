"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { DrillingReport } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { DrillingPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { OpsPerfBars } from "@/components/admin/ux/OpsPerfBars";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";

export function DrillingManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("reports");
  const [rows, setRows] = useState<DrillingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const { projects } = useOpsReferential();
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");
  const [rigName, setRigName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [depthStart, setDepthStart] = useState(0);
  const [depthEnd, setDepthEnd] = useState(0);
  const [targetMeters, setTargetMeters] = useState(60);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));

  const metersDrilled = Math.max(0, depthEnd - depthStart);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/drilling", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as DrillingReport[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("tab") === "new") setTab("new");
  }, [searchParams]);

  const byRig = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.rigName || "—", (map.get(r.rigName || "—") ?? 0) + r.metersDrilled);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalMeters = rows.reduce((a, r) => a + r.metersDrilled, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.siteName.toLowerCase().includes(q) ||
        r.rigName.toLowerCase().includes(q) ||
        r.operatorName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const { sort, onSort, applySort } = useTableSort("reportDate", "desc");

  const sortAccessors = useMemo(
    () => ({
      reportDate: (r: DrillingReport) => r.reportDate,
      siteName: (r: DrillingReport) => r.siteName,
      rigName: (r: DrillingReport) => r.rigName,
      metersDrilled: (r: DrillingReport) => r.metersDrilled,
      targetMeters: (r: DrillingReport) => r.targetMeters,
    }),
    [],
  );

  const sortedRows = useMemo(
    () => applySort(filtered, sortAccessors),
    [filtered, applySort, sortAccessors],
  );

  async function submit() {
    if (!rigName.trim()) {
      toast.error("Indiquez le nom de la foreuse.");
      return;
    }
    if (metersDrilled <= 0) {
      toast.error("Les profondeurs doivent donner des mètres forés positifs.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/drilling", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportDate,
        projectId,
        rigName,
        operatorName,
        depthStart,
        depthEnd,
        targetMeters,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Rapport de foration enregistré.");
    await load();
    setTab("reports");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Rapport foration"
        description="Performance foreuses et rapports journaliers."
        exportHref="/api/admin/drilling?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("new")}>
            Nouveau rapport
          </button>
        }
      />

      <ReferentialBanner sitesCount={projects.length} requireSites />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Mètres forés", value: `${totalMeters.toLocaleString("fr-MA")} m` },
            { label: "Rapports", value: String(rows.length) },
            { label: "Foreuses", value: String(byRig.length) },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "reports", label: "Rapports", badge: rows.length || undefined },
          { id: "perf", label: "Par foreuse" },
          { id: "new", label: "Saisir" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <DrillingPageSkeleton partial /> : null}

      {!loading && tab === "perf" ? (
        <OpsPerfBars
          barClassName="bg-[var(--navy)]"
          items={byRig.map(([label, value]) => ({ label, value, suffix: " m" }))}
        />
      ) : null}

      {!loading && tab === "reports" ? (
        <AdminInventoryCard
          title="Liste des rapports"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Chantier, foreuse…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun rapport de foration enregistré."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("new")}>
                Nouveau rapport
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Date" sortKey="reportDate" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Chantier" sortKey="siteName" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Foreuse" sortKey="rigName" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Mètres" sortKey="metersDrilled" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Cible" sortKey="targetMeters" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.reportDate}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.siteName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.rigName} lines={1} />
                    </td>
                    <td className={tdClass}>{r.metersDrilled}</td>
                    <td className={tdClass}>{r.targetMeters}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title="Nouveau rapport"
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
            <input className={inputClass} placeholder="Foreuse *" value={rigName} onChange={(e) => setRigName(e.target.value)} />
            <input className={inputClass} placeholder="Opérateur" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className={inputClass} placeholder="Prof. début" value={depthStart} onChange={(e) => setDepthStart(Number(e.target.value) || 0)} />
              <input type="number" className={inputClass} placeholder="Prof. fin" value={depthEnd} onChange={(e) => setDepthEnd(Number(e.target.value) || 0)} />
            </div>
            <p className="text-sm text-[var(--navy)]">
              Mètres forés : <strong>{metersDrilled}</strong>
            </p>
            <input type="number" className={inputClass} placeholder="Cible (m)" value={targetMeters} onChange={(e) => setTargetMeters(Number(e.target.value) || 0)} />
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
