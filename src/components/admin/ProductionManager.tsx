"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { ProductionEntry } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function ProductionManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("daily");
  const [rows, setRows] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const { projects } = useOpsReferential();
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");
  const [tonnage, setTonnage] = useState(0);
  const [targetTonnage, setTargetTonnage] = useState(0);
  const [material, setMaterial] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/production", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as ProductionEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bySite = useMemo(() => {
    const map = new Map<string, { tonnage: number; target: number }>();
    for (const r of rows) {
      const k = r.siteName || "—";
      const cur = map.get(k) ?? { tonnage: 0, target: 0 };
      cur.tonnage += r.tonnage;
      cur.target += r.targetTonnage;
      map.set(k, cur);
    }
    return [...map.entries()];
  }, [rows]);

  const totalTonnage = rows.reduce((a, r) => a + r.tonnage, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.siteName.toLowerCase().includes(q) || (r.material || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function submit() {
    if (tonnage <= 0) {
      toast.error("Indiquez un tonnage réalisé.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryDate, projectId, tonnage, targetTonnage, material }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Production enregistrée.");
    await load();
    setTab("daily");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Production"
        description="Tonnage journalier et performance par chantier."
        exportHref="/api/admin/production?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("new")}>
            Saisir production
          </button>
        }
      />

      <ReferentialBanner sitesCount={projects.length} requireSites />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Tonnage total", value: `${totalTonnage.toLocaleString("fr-MA")} t` },
            { label: "Saisies", value: String(rows.length) },
            { label: "Chantiers", value: String(bySite.length) },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "daily", label: "Journal", badge: rows.length || undefined },
          { id: "sites", label: "Par chantier" },
          { id: "new", label: "Saisir" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "sites" ? (
        <div className="space-y-2">
          {bySite.length === 0 ? (
            <p className="text-sm text-[var(--graphite)]/70">Aucune donnée par chantier.</p>
          ) : (
            bySite.map(([name, v]) => {
              const pct = v.target > 0 ? Math.round((v.tonnage / v.target) * 100) : 0;
              return (
                <div key={name} className="rounded-md border border-border bg-white px-4 py-2.5">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-[var(--navy)]">{name}</span>
                    <span>
                      {v.tonnage} t / {v.target} t ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
                    <div className="h-full bg-[var(--gold)]" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {!loading && tab === "daily" ? (
        <AdminInventoryCard
          title="Journal de production"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Chantier, matériau…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucune saisie de production enregistrée."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("new")}>
                Saisir production
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Chantier</th>
                  <th className={thClass}>Tonnage</th>
                  <th className={thClass}>Cible</th>
                  <th className={thClass}>Matériau</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.entryDate}</td>
                    <td className={tdClass}>{r.siteName || "—"}</td>
                    <td className={tdClass}>{r.tonnage}</td>
                    <td className={tdClass}>{r.targetTonnage}</td>
                    <td className={tdClass}>{r.material || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title="Saisie production"
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
            <input className={inputClass} placeholder="Matériau" value={material} onChange={(e) => setMaterial(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" className={inputClass} placeholder="Tonnage *" value={tonnage || ""} onChange={(e) => setTonnage(Number(e.target.value) || 0)} />
              <input type="number" className={inputClass} placeholder="Cible" value={targetTonnage || ""} onChange={(e) => setTargetTonnage(Number(e.target.value) || 0)} />
            </div>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
