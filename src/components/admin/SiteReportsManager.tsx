"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import {
  SITE_REPORT_STATUS_LABELS,
  SITE_REPORT_TYPE_LABELS,
  SITE_REPORT_TYPES,
  type SiteReport,
  type SiteReportType,
} from "@/lib/admin/site-report-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { SiteReportsPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useAdminListFormNav } from "@/components/admin/ux/useAdminListFormNav";
import { formatDateFr, formatDateTimeFr } from "@/lib/admin/date-time-fr";

export function SiteReportsManager({
  defaultProjectId,
  embedded,
  defaultType,
}: {
  defaultProjectId?: string;
  embedded?: boolean;
  defaultType?: SiteReportType;
}) {
  const toast = useAdminToast();
  const pathname = usePathname();
  const { projects } = useOpsReferential();
  const [rows, setRows] = useState<SiteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    tab,
    editingId: editId,
    returnToList,
    openFormNew,
    openFormEdit,
  } = useAdminListFormNav({ pathname, loading });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState(defaultProjectId ?? "");
  const [reportType, setReportType] = useState<SiteReportType>(defaultType ?? "journalier");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [activities, setActivities] = useState("");
  const [quantities, setQuantities] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filterProjectId ? `?project=${encodeURIComponent(filterProjectId)}` : "";
    const res = await fetch(`/api/admin/site-reports${qs}`, { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as SiteReport[]);
    setLoading(false);
  }, [filterProjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        r.activities.toLowerCase().includes(q) ||
        SITE_REPORT_TYPE_LABELS[r.reportType].toLowerCase().includes(q),
    );
  }, [rows, search]);

  const { sort, onSort, applySort } = useTableSort("date", "desc");

  const reportSortAccessors = useMemo(
    () => ({
      number: (r: SiteReport) => r.number,
      type: (r: SiteReport) => SITE_REPORT_TYPE_LABELS[r.reportType],
      date: (r: SiteReport) => r.reportDate,
      project: (r: SiteReport) => projects.find((p) => p.id === r.projectId)?.name ?? "",
      status: (r: SiteReport) => SITE_REPORT_STATUS_LABELS[r.status],
    }),
    [projects],
  );

  const sortedFiltered = useMemo(
    () => applySort(filtered, reportSortAccessors),
    [filtered, applySort, reportSortAccessors],
  );

  const reportTypeOptions = useMemo(
    () => Object.fromEntries(SITE_REPORT_TYPES.map((t) => [t, SITE_REPORT_TYPE_LABELS[t]])),
    [],
  );

  function resetForm() {
    setReportType(defaultType ?? "journalier");
    setProjectId(defaultProjectId ?? filterProjectId ?? "");
    setReportDate(new Date().toISOString().slice(0, 10));
    setPeriodFrom("");
    setPeriodTo("");
    setActivities("");
    setQuantities("");
    setBlockers("");
    setNextActions("");
    setNotes("");
  }

  function openEdit(row: SiteReport) {
    setReportType(row.reportType);
    setProjectId(row.projectId ?? "");
    setReportDate(row.reportDate);
    setPeriodFrom(row.periodFrom ?? "");
    setPeriodTo(row.periodTo ?? "");
    setActivities(row.activities);
    setQuantities(row.quantities);
    setBlockers(row.blockers);
    setNextActions(row.nextActions);
    setNotes(row.notes);
    openFormEdit(row.id);
  }

  async function save() {
    if (!activities.trim() && !quantities.trim()) {
      toast.error("Saisissez au moins les activités ou les quantités.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/site-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId ?? undefined,
        reportType,
        projectId: projectId || null,
        reportDate,
        periodFrom: periodFrom || null,
        periodTo: periodTo || null,
        activities,
        quantities,
        blockers,
        nextActions,
        notes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Rapport mis à jour." : "Rapport créé.");
    resetForm();
    returnToList();
    await load();
  }

  async function remove(id: string) {
    if (!(await confirmDelete("Supprimer ce rapport ?"))) return;
    const res = await fetch(`/api/admin/site-reports?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Rapport supprimé.");
    await load();
  }

  if (loading && tab === "list") {
    return embedded ? <SiteReportsPanelSkeleton embedded /> : <SiteReportsPanelSkeleton />;
  }

  const wrapClass = embedded ? "space-y-4" : moduleWrap;

  return (
    <div className={wrapClass}>
      {!embedded ? (
        <OpsModuleHeader
          title="Rapports chantier"
          description="Journalier, hebdomadaire, avancement, production — export PDF ou liste CSV/Excel."
          exportHref="/api/admin/site-reports"
          actions={
            tab === "list" ? (
              <button type="button" className={btnPrimary} onClick={() => { resetForm(); openFormNew(); }}>
                Nouveau rapport
              </button>
            ) : (
              <button type="button" className={btnSecondary} onClick={() => { resetForm(); returnToList(); }}>
                Retour liste
              </button>
            )
          }
        />
      ) : tab === "list" ? (
        <div className="flex justify-end">
          <button type="button" className={btnPrimary} onClick={() => { resetForm(); openFormNew(); }}>
            Nouveau rapport
          </button>
        </div>
      ) : null}

      <AdminTabs
        tabs={[
          { id: "list", label: "Liste", badge: rows.length || undefined },
          { id: "form", label: editId ? "Modifier" : "Nouveau" },
        ]}
        active={tab}
        onChange={(id) => {
          if (id === "list") {
            resetForm();
            returnToList();
            return;
          }
          if (!editId) {
            resetForm();
            openFormNew();
          }
        }}
      />

      {tab === "list" ? (
        <div className="space-y-4">
          <AdminMiniStats
            items={[
              { label: "Total", value: String(rows.length) },
              { label: "Brouillons", value: String(rows.filter((r) => r.status === "draft").length) },
              { label: "Validés", value: String(rows.filter((r) => r.status === "validated").length) },
            ]}
          />
          <AdminInventoryCard title="Rapports" search={search} onSearchChange={setSearch} searchPlaceholder="N°, activités…">
            {!embedded ? (
              <div className="border-b border-border px-4 py-3">
                <p className={labelClass}>Filtrer par chantier</p>
                <div className="mt-1 max-w-xs">
                  <ProjectSelect
                    projects={projects}
                    value={filterProjectId}
                    onChange={setFilterProjectId}
                    allowEmpty
                    placeholder="— Tous —"
                  />
                </div>
              </div>
            ) : null}
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                Aucun rapport.
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => { resetForm(); openFormNew(); }}>
                  Nouveau rapport
                </button>
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminSortableTh label="N°" sortKey="number" sort={sort} onSort={onSort} />
                    <AdminSortableTh label="Type" sortKey="type" sort={sort} onSort={onSort} />
                    <AdminSortableTh label="Date" sortKey="date" sort={sort} onSort={onSort} />
                    <AdminSortableTh label="Chantier" sortKey="project" sort={sort} onSort={onSort} />
                    <AdminSortableTh label="Statut" sortKey="status" sort={sort} onSort={onSort} />
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((row) => (
                    <tr key={row.id} className={rowHover}>
                      <td className={`${tdClass} font-mono text-xs`}>{row.number}</td>
                      <td className={tdClass}>{SITE_REPORT_TYPE_LABELS[row.reportType]}</td>
                      <td className={tdClass}>{formatDateFr(row.reportDate)}</td>
                      <td className={tdClass}>
                        <AdminTruncatedText
                          text={projects.find((p) => p.id === row.projectId)?.name}
                          lines={1}
                        />
                      </td>
                      <td className={tdClass}>{SITE_REPORT_STATUS_LABELS[row.status]}</td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/api/admin/site-reports?id=${encodeURIComponent(row.id)}&format=pdf`}
                            className={btnSecondary}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF
                          </a>
                          <button type="button" className={btnSecondary} onClick={() => openEdit(row)}>
                            Ouvrir
                          </button>
                          <button type="button" className={btnDanger} onClick={() => void remove(row.id)}>
                            Suppr.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </div>
      ) : (
        <AdminFormCard
          title={editId ? "Modifier le rapport" : "Nouveau rapport chantier"}
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Créer le rapport"}
              </button>
              {editId ? (
                <a
                  href={`/api/admin/site-reports?id=${encodeURIComponent(editId)}&format=pdf`}
                  className={btnSecondary}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PDF
                </a>
              ) : null}
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Type</p>
              <div className="mt-1">
                <SearchableEnumSelect
                  options={reportTypeOptions}
                  value={reportType}
                  onChange={(v) => setReportType(v as SiteReportType)}
                  inputClassName={inputClass}
                  allowEmpty={false}
                />
              </div>
            </div>
            <div>
              <p className={labelClass}>Date du rapport</p>
              <input type="date" className={`${inputClass} mt-1`} value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Chantier</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
              </div>
            </div>
            <div>
              <p className={labelClass}>Période du</p>
              <input type="date" className={`${inputClass} mt-1`} value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Période au</p>
              <input type="date" className={`${inputClass} mt-1`} value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Activités réalisées</p>
              <textarea className={`${inputClass} mt-1 min-h-[90px]`} value={activities} onChange={(e) => setActivities(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Quantités</p>
              <textarea className={`${inputClass} mt-1 min-h-[70px]`} value={quantities} onChange={(e) => setQuantities(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Blocages</p>
              <textarea className={`${inputClass} mt-1 min-h-[70px]`} value={blockers} onChange={(e) => setBlockers(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Prochaines actions</p>
              <textarea className={`${inputClass} mt-1 min-h-[70px]`} value={nextActions} onChange={(e) => setNextActions(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Notes</p>
              <textarea className={`${inputClass} mt-1 min-h-[60px]`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </AdminFormCard>
      )}

      {!embedded ? (
        <p className="text-xs text-[var(--graphite)]/65">
          <Link href="/admin/pv" className="underline">
            Procès-verbaux
          </Link>
          {" · "}
          <Link href="/admin/etats" className="underline">
            États ERP
          </Link>
        </p>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
