"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { HrDailyPointagePanel } from "@/components/admin/HrDailyPointagePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { AttendanceRecord } from "@/components/admin/operations-types";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/admin/attendance-labels";
import {
  btnPrimary,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { HrPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { useAdminToast } from "@/components/admin/ux/useAdminToast";

export function HRManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("daily");
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const { projects, employees, refresh: refreshRef } = useOpsReferential();
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");

  const month = recordDate.slice(0, 7);

  const load = useCallback(async () => {
    setLoading(true);
    const attRes = await fetch(`/api/admin/attendance?month=${month}`, { cache: "no-store" });
    if (attRes.ok) setRows((await attRes.json()) as AttendanceRecord[]);
    await refreshRef();
    setLoading(false);
  }, [month, refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const recapByRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.status === "present") {
        map.set(r.role || "—", (map.get(r.role || "—") ?? 0) + 1);
      }
    }
    return [...map.entries()];
  }, [rows]);

  const presentCount = rows.filter((r) => r.status === "present").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(q) ||
        r.matricule.toLowerCase().includes(q) ||
        (r.role || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="RH & pointage"
        description="Pointage quotidien en masse, historique et récap mensuel."
        exportHref="/api/admin/attendance?format=csv"
        actions={
          <button type="button" className={`${btnPrimary} w-full sm:w-auto`} onClick={() => setTab("daily")}>
            Pointage du jour
          </button>
        }
      />

      <ReferentialBanner sitesCount={projects.length} employeesCount={employees.length} requireEmployees />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Saisies (mois)", value: String(rows.length) },
            { label: "Présences", value: String(presentCount) },
            { label: "Personnel", value: String(employees.length) },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "daily", label: "Pointage du jour" },
          { id: "list", label: "Historique", badge: rows.length || undefined },
          { id: "recap", label: "Récap mensuel" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && tab !== "daily" ? <HrPageSkeleton partial /> : null}

      {tab === "daily" ? (
        <HrDailyPointagePanel
          employees={employees}
          projects={projects}
          initialDate={recordDate}
          initialProjectId={projectId}
          onDateChange={setRecordDate}
          onSaved={load}
          onError={toast.error}
          onSuccess={toast.success}
        />
      ) : null}

      {!loading && tab === "recap" ? (
        <AdminFormCard title={`Présences par poste — ${month}`}>
          {recapByRole.length === 0 ? (
            <p className="text-sm text-[var(--graphite)]/70">Aucune présence ce mois-ci.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {recapByRole.map(([role, count]) => (
                <li key={role} className="flex justify-between border-b border-border/60 py-1.5 last:border-0">
                  <span>{role}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminFormCard>
      ) : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
          title="Historique des pointages"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, matricule…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun pointage enregistré ce mois-ci."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("daily")}>
                Pointage du jour
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Matricule</th>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>Entrée</th>
                  <th className={thClass}>Sortie</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass}>Chantier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.recordDate}</td>
                    <td className={tdClass}>{r.matricule}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.employeeName} lines={1} />
                    </td>
                    <td className={tdClass}>{r.timeIn}</td>
                    <td className={tdClass}>{r.timeOut}</td>
                    <td className={tdClass}>{ATTENDANCE_STATUS_LABELS[r.status]}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.siteName} lines={1} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
          <p className="border-t border-border px-5 py-3 text-xs text-[var(--graphite)]/70">
            Pour modifier une journée, ouvrez l&apos;onglet{" "}
            <button type="button" className="underline text-[var(--navy)]" onClick={() => setTab("daily")}>
              Pointage du jour
            </button>
            .
          </p>
        </AdminInventoryCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
