"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import type {
  AdminEmployee,
  AdminProject,
  AttendanceRecord,
  AttendanceStatus,
} from "@/components/admin/operations-types";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_TONE,
  DEFAULT_TIME_IN,
  DEFAULT_TIME_OUT,
} from "@/lib/admin/attendance-labels";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";

type PointageDraft = {
  id?: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  role: string;
  status: AttendanceStatus;
  timeIn: string;
  timeOut: string;
};

type HrDailyPointagePanelProps = {
  employees: AdminEmployee[];
  projects: AdminProject[];
  initialDate?: string;
  initialProjectId?: string;
  onDateChange?: (date: string) => void;
  onSaved: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

const STATUS_OPTIONS = ATTENDANCE_STATUS_LABELS;

function buildDrafts(
  employees: AdminEmployee[],
  records: AttendanceRecord[],
  defaultTimeIn: string,
  defaultTimeOut: string,
): PointageDraft[] {
  const byEmployee = new Map(records.map((r) => [r.employeeId, r]));
  return employees.map((emp) => {
    const existing = byEmployee.get(emp.id);
    return {
      id: existing?.id,
      employeeId: emp.id,
      employeeName: emp.name,
      matricule: emp.cin,
      role: emp.role,
      status: existing?.status ?? "present",
      timeIn: existing?.timeIn || defaultTimeIn,
      timeOut: existing?.timeOut || defaultTimeOut,
    };
  });
}

export function HrDailyPointagePanel({
  employees,
  projects,
  initialDate,
  initialProjectId = "",
  onDateChange,
  onSaved,
  onError,
  onSuccess,
}: HrDailyPointagePanelProps) {
  const [dayDate, setDayDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState(initialProjectId);
  const [defaultTimeIn, setDefaultTimeIn] = useState(DEFAULT_TIME_IN);
  const [defaultTimeOut, setDefaultTimeOut] = useState(DEFAULT_TIME_OUT);
  const [drafts, setDrafts] = useState<PointageDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  const roles = useMemo(
    () => [...new Set(employees.map((e) => e.role).filter(Boolean))].sort(),
    [employees],
  );

  const loadDay = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/attendance?date=${dayDate}`, { cache: "no-store" });
    if (!res.ok) {
      onError(await readApiError(res));
      setLoading(false);
      return;
    }
    const records = (await res.json()) as AttendanceRecord[];
    setDrafts(buildDrafts(employees, records, defaultTimeIn, defaultTimeOut));
    setDirty(false);
    setLoading(false);
  }, [dayDate, employees, onError]);

  useEffect(() => {
    void loadDay();
  }, [loadDay]);

  const draftByEmployee = useMemo(
    () => new Map(drafts.map((d) => [d.employeeId, d])),
    [drafts],
  );

  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((emp) => {
      if (projectId && emp.defaultProjectId !== projectId) return false;
      if (roleFilter && emp.role !== roleFilter) return false;
      if (!q) return true;
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.cin.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q)
      );
    });
  }, [employees, projectId, roleFilter, search]);

  const { sort, onSort, applySort } = useTableSort("cin", "asc");

  const sortAccessors = useMemo(
    () => ({
      cin: (emp: AdminEmployee) => emp.cin,
      name: (emp: AdminEmployee) => emp.name,
      role: (emp: AdminEmployee) => emp.role,
      status: (emp: AdminEmployee) =>
        ATTENDANCE_STATUS_LABELS[draftByEmployee.get(emp.id)?.status ?? "present"],
      timeIn: (emp: AdminEmployee) => draftByEmployee.get(emp.id)?.timeIn ?? "",
      timeOut: (emp: AdminEmployee) => draftByEmployee.get(emp.id)?.timeOut ?? "",
    }),
    [draftByEmployee],
  );

  const sortedVisibleEmployees = useMemo(
    () => applySort(visibleEmployees, sortAccessors),
    [applySort, visibleEmployees, sortAccessors],
  );

  const visibleIdList = useMemo(
    () => visibleEmployees.map((e) => e.id),
    [visibleEmployees],
  );

  useEffect(() => {
    const next = new Set(visibleIdList);
    setSelectedIds((prev) => {
      const kept = new Set([...prev].filter((id) => next.has(id)));
      if (kept.size > 0) return kept;
      return next;
    });
  }, [visibleIdList]);

  const selectedVisibleIds = useMemo(() => {
    const visible = new Set(visibleIdList);
    return new Set([...selectedIds].filter((id) => visible.has(id)));
  }, [selectedIds, visibleIdList]);

  const allVisibleSelected =
    visibleEmployees.length > 0 &&
    visibleEmployees.every((e) => selectedVisibleIds.has(e.id));
  const someVisibleSelected =
    visibleEmployees.some((e) => selectedVisibleIds.has(e.id)) && !allVisibleSelected;

  const statusCounts = useMemo(() => {
    const counts = new Map<AttendanceStatus, number>();
    for (const status of ATTENDANCE_STATUSES) counts.set(status, 0);
    for (const emp of visibleEmployees) {
      if (!selectedVisibleIds.has(emp.id)) continue;
      const status = draftByEmployee.get(emp.id)?.status ?? "present";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return counts;
  }, [draftByEmployee, selectedVisibleIds, visibleEmployees]);

  function patchDraft(employeeId: string, patch: Partial<PointageDraft>) {
    setDrafts((prev) =>
      prev.map((row) => (row.employeeId === employeeId ? { ...row, ...patch } : row)),
    );
    setDirty(true);
  }

  function patchTargets(patch: Partial<PointageDraft> | ((row: PointageDraft) => Partial<PointageDraft>)) {
    const ids = selectedVisibleIds;
    setDrafts((prev) =>
      prev.map((row) => {
        if (!ids.has(row.employeeId)) return row;
        const nextPatch = typeof patch === "function" ? patch(row) : patch;
        return { ...row, ...nextPatch };
      }),
    );
    setDirty(true);
  }

  function setStatusForTargets(status: AttendanceStatus) {
    patchTargets({ status });
  }

  function applyDefaultTimesToTargets() {
    patchTargets({ timeIn: defaultTimeIn, timeOut: defaultTimeOut });
  }

  function applyBulkStatus() {
    if (!bulkStatus || !ATTENDANCE_STATUSES.includes(bulkStatus as AttendanceStatus)) return;
    setStatusForTargets(bulkStatus as AttendanceStatus);
    setBulkStatus("");
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleIdList));
  }

  function toggleRow(employeeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      return next;
    });
  }

  async function saveAll() {
    const entries = drafts.filter((d) => selectedVisibleIds.has(d.employeeId));
    if (entries.length === 0) {
      onError("Sélectionnez au moins un collaborateur à enregistrer.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordDate: dayDate,
        projectId,
        entries: entries.map((d) => ({
          id: d.id,
          employeeId: d.employeeId,
          employeeName: d.employeeName,
          matricule: d.matricule,
          role: d.role,
          timeIn: d.timeIn,
          timeOut: d.timeOut,
          status: d.status,
        })),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }

    const payload = (await res.json()) as { saved: number };
    onSuccess(`${payload.saved} pointage${payload.saved > 1 ? "s" : ""} enregistré${payload.saved > 1 ? "s" : ""}.`);
    setDirty(false);
    await onSaved();
    await loadDay();
  }

  const roleOptions = useMemo(() => {
    const opts: Record<string, string> = { "": "Tous les postes" };
    for (const role of roles) opts[role] = role;
    return opts;
  }, [roles]);

  function changeDay(next: string) {
    setDayDate(next);
    onDateChange?.(next);
  }

  function shiftDay(delta: number) {
    const next = new Date(`${dayDate}T12:00:00`);
    next.setDate(next.getDate() + delta);
    changeDay(next.toISOString().slice(0, 10));
  }

  const selectionLabel =
    selectedVisibleIds.size === visibleEmployees.length
      ? `Tous (${selectedVisibleIds.size})`
      : `${selectedVisibleIds.size} sélectionné${selectedVisibleIds.size > 1 ? "s" : ""}`;

  return (
    <div className="space-y-4">
      <AdminFormCard
        title="Pointage du jour"
        hint="Cochez le personnel du jour, appliquez le statut en masse, enregistrez une seule fois."
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={saving || loading || selectedVisibleIds.size === 0}
              onClick={() => void saveAll()}
            >
              {saving
                ? "Enregistrement…"
                : `Enregistrer ${selectedVisibleIds.size} collaborateur${selectedVisibleIds.size > 1 ? "s" : ""}`}
            </button>
            {dirty ? <span className="text-xs text-amber-700">Modifications non enregistrées</span> : null}
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[auto_1fr_auto] lg:items-end">
          <div className="flex flex-wrap items-end gap-2">
            <button type="button" className={btnSecondary} onClick={() => shiftDay(-1)} aria-label="Jour précédent">
              ←
            </button>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--graphite)]/80">Date</label>
              <input
                type="date"
                className={inputClass}
                value={dayDate}
                onChange={(e) => changeDay(e.target.value)}
              />
            </div>
            <button type="button" className={btnSecondary} onClick={() => shiftDay(1)} aria-label="Jour suivant">
              →
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => changeDay(new Date().toISOString().slice(0, 10))}
            >
              Aujourd&apos;hui
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--graphite)]/80">Chantier (filtre)</label>
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--graphite)]/80">Entrée défaut</label>
              <input
                type="time"
                className={inputClass}
                value={defaultTimeIn}
                onChange={(e) => setDefaultTimeIn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--graphite)]/80">Sortie défaut</label>
              <input
                type="time"
                className={inputClass}
                value={defaultTimeOut}
                onChange={(e) => setDefaultTimeOut(e.target.value)}
              />
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--graphite)]/70">
          Personnel géré dans{" "}
          <Link href="/admin/personnel" className="underline text-[var(--navy)]">
            Personnel
          </Link>
          .
        </p>
      </AdminFormCard>

      <AdminInventoryCard
        title={`Tableau pointage — ${visibleEmployees.length} affiché${visibleEmployees.length > 1 ? "s" : ""}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Nom, N° CIN, poste…"
        actions={
          roles.length > 1 ? (
            <SearchableEnumSelect
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              inputClassName={`${inputClass} w-full sm:max-w-[12rem]`}
              placeholder="Tous les postes"
            />
          ) : null
        }
      >
        {!loading && selectedVisibleIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-[var(--background)]/80 px-4 py-3">
            <span className="text-sm font-medium text-[var(--navy)]">{selectionLabel}</span>
            <button
              type="button"
              className={btnPrimary}
              disabled={selectedVisibleIds.size === 0}
              onClick={() => setStatusForTargets("present")}
            >
              Présents
            </button>
            <button type="button" className={btnSecondary} onClick={applyDefaultTimesToTargets}>
              Horaires défaut
            </button>
            <div className="flex w-full min-w-0 flex-1 flex-wrap items-center gap-2 sm:max-w-[14rem]">
              <SearchableEnumSelect
                options={STATUS_OPTIONS}
                value={bulkStatus}
                onChange={setBulkStatus}
                placeholder="Autre statut…"
                inputClassName={`${inputClass} py-1.5`}
                allowEmpty
                compact
              />
              <button
                type="button"
                className={btnSecondary}
                disabled={!bulkStatus}
                onClick={applyBulkStatus}
              >
                Appliquer
              </button>
            </div>
            <button type="button" className={btnSecondary} onClick={() => setSelectedIds(new Set(visibleIdList))}>
              Tout cocher
            </button>
            <button type="button" className={btnSecondary} onClick={() => setSelectedIds(new Set())}>
              Tout décocher
            </button>
          </div>
        ) : null}

        {!loading && visibleEmployees.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-2">
            {ATTENDANCE_STATUSES.map((status) => {
              const count = statusCounts.get(status) ?? 0;
              if (count === 0) return null;
              const tone = ATTENDANCE_STATUS_TONE[status];
              return (
                <span
                  key={status}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone.badge}`}
                >
                  {ATTENDANCE_STATUS_LABELS[status]} · {count}
                </span>
              );
            })}
          </div>
        ) : null}

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">Chargement…</div>
        ) : employees.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            Aucun collaborateur. Ajoutez du personnel d&apos;abord.
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            Aucun collaborateur pour ce filtre.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr className="border-b border-border bg-[var(--background)]/60">
                  <th className={`${thClass} w-10`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someVisibleSelected;
                      }}
                      onChange={toggleSelectAll}
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <AdminSortableTh label="N° CIN" sortKey="cin" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Nom" sortKey="name" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Poste" sortKey="role" sort={sort} onSort={onSort} />
                  <AdminSortableTh
                    label="Statut"
                    sortKey="status"
                    sort={sort}
                    onSort={onSort}
                    className={`${thClass} min-w-[10rem]`}
                  />
                  <AdminSortableTh
                    label="Entrée"
                    sortKey="timeIn"
                    sort={sort}
                    onSort={onSort}
                    className={`${thClass} w-[7rem]`}
                  />
                  <AdminSortableTh
                    label="Sortie"
                    sortKey="timeOut"
                    sort={sort}
                    onSort={onSort}
                    className={`${thClass} w-[7rem]`}
                  />
                </tr>
              </thead>
              <tbody>
                {sortedVisibleEmployees.map((emp) => {
                  const draft = draftByEmployee.get(emp.id);
                  if (!draft) return null;
                  const selected = selectedVisibleIds.has(emp.id);
                  const tone = ATTENDANCE_STATUS_TONE[draft.status];
                  const showTimes = draft.status === "present";
                  return (
                    <tr
                      key={emp.id}
                      className={`${rowHover} border-b border-border/60 ${selected ? tone.row : "opacity-55"}`}
                      onClick={() => toggleRow(emp.id)}
                    >
                      <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={selected}
                          onChange={() => toggleRow(emp.id)}
                          aria-label={`Sélectionner ${emp.name}`}
                        />
                      </td>
                      <td className={`${tdClass} tabular-nums`}>{emp.cin}</td>
                      <td className={tdClass}>
                        <AdminTruncatedText text={emp.name} lines={1} />
                      </td>
                      <td className={tdClass}>
                        <AdminTruncatedText text={emp.role} lines={1} />
                      </td>
                      <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                        <SearchableEnumSelect
                          options={STATUS_OPTIONS}
                          value={draft.status}
                          onChange={(v) => patchDraft(emp.id, { status: v as AttendanceStatus })}
                          inputClassName={`${inputClass} min-w-[9rem] py-1.5`}
                          allowEmpty={false}
                          compact
                        />
                      </td>
                      <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                        {showTimes ? (
                          <input
                            type="time"
                            className={`${inputClass} w-full py-1`}
                            value={draft.timeIn}
                            onChange={(e) => patchDraft(emp.id, { timeIn: e.target.value })}
                            aria-label={`Entrée ${emp.name}`}
                          />
                        ) : (
                          <span className="text-xs text-[var(--graphite)]/50">—</span>
                        )}
                      </td>
                      <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                        {showTimes ? (
                          <input
                            type="time"
                            className={`${inputClass} w-full py-1`}
                            value={draft.timeOut}
                            onChange={(e) => patchDraft(emp.id, { timeOut: e.target.value })}
                            aria-label={`Sortie ${emp.name}`}
                          />
                        ) : (
                          <span className="text-xs text-[var(--graphite)]/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
    </div>
  );
}
