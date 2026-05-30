"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { EmployeeSelectWithAdd } from "@/components/admin/EmployeeSelectWithAdd";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { AttendanceRecord, AttendanceStatus, PersonnelCategory } from "@/components/admin/operations-types";
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

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  sick: "Maladie",
  unexcused: "Abs. injustifiée",
  leave: "Congé",
  mission: "Mission",
  training: "Formation",
};

export function HRManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("list");
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const { projects, employees, refresh: refreshRef } = useOpsReferential();
  const [personnelCategories, setPersonnelCategories] = useState<PersonnelCategory[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [timeIn, setTimeIn] = useState("07:00");
  const [timeOut, setTimeOut] = useState("17:00");
  const [status, setStatus] = useState<AttendanceStatus>("present");
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

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/personnel-categories", { cache: "no-store" });
      if (res.ok) setPersonnelCategories((await res.json()) as PersonnelCategory[]);
    })();
  }, []);

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

  async function submitAttendance() {
    if (!employeeId) {
      toast.error("Sélectionnez un employé.");
      return;
    }
    setSaving(true);
    const emp = employees.find((e) => e.id === employeeId);
    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        employeeName: emp?.name || "",
        matricule: emp?.matricule || "",
        role: emp?.role || "",
        recordDate,
        timeIn,
        timeOut,
        status,
        projectId,
        siteName: projects.find((p) => p.id === projectId)?.name || emp?.defaultProjectName || "",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Pointage enregistré.");
    await load();
    setTab("list");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="RH & pointage"
        description="Personnel, saisie quotidienne et récap mensuel."
        exportHref="/api/admin/attendance?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("entry")}>
            Saisir pointage
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
          { id: "list", label: "Liste", badge: rows.length || undefined },
          { id: "entry", label: "Saisir pointage" },
          { id: "recap", label: "Récap mensuel" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

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
          title="Liste des pointages"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, matricule…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun pointage enregistré ce mois-ci."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("entry")}>
                Saisir pointage
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.recordDate}</td>
                    <td className={tdClass}>{r.matricule}</td>
                    <td className={tdClass}>{r.employeeName}</td>
                    <td className={tdClass}>{r.timeIn}</td>
                    <td className={tdClass}>{r.timeOut}</td>
                    <td className={tdClass}>{STATUS_LABELS[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "entry" ? (
        <AdminFormCard
          title="Pointage"
          hint="Gérez la liste du personnel dans Personnel."
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitAttendance()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            <EmployeeSelectWithAdd
              employees={employees}
              categories={personnelCategories}
              projects={projects}
              value={employeeId}
              onChange={setEmployeeId}
              onEmployeeAdded={async () => refreshRef()}
              onCategoriesChange={setPersonnelCategories}
              label="Collaborateur"
            />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} placeholder="Entrée" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
              <input className={inputClass} placeholder="Sortie" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
            </div>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((k) => (
                <option key={k} value={k}>
                  {STATUS_LABELS[k]}
                </option>
              ))}
            </select>
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
          </div>
          <p className="mt-3 text-xs text-[var(--graphite)]/70">
            <Link href="/admin/personnel" className="underline text-[var(--navy)]">
              Personnel
            </Link>
          </p>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
