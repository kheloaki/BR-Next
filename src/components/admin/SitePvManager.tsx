"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import {
  SITE_PV_STATUS_LABELS,
  SITE_PV_TYPE_LABELS,
  SITE_PV_TYPES,
  type SitePv,
  type SitePvType,
} from "@/lib/admin/site-pv-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
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
import { AdminTabs } from "@/components/admin/AdminTabs";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function SitePvManager({ defaultProjectId, embedded }: { defaultProjectId?: string; embedded?: boolean }) {
  const toast = useAdminToast();
  const { projects } = useOpsReferential();
  const [tab, setTab] = useState<"list" | "form">("list");
  const [rows, setRows] = useState<SitePv[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState(defaultProjectId ?? "");
  const [editId, setEditId] = useState<string | null>(null);

  const [pvType, setPvType] = useState<SitePvType>("reunion_chantier");
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [pvDate, setPvDate] = useState(new Date().toISOString().slice(0, 10));
  const [object, setObject] = useState("");
  const [observations, setObservations] = useState("");
  const [decisions, setDecisions] = useState("");
  const [reserves, setReserves] = useState("");
  const [participantsText, setParticipantsText] = useState("");
  const [actionsText, setActionsText] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [deadline, setDeadline] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = filterProjectId ? `?project=${encodeURIComponent(filterProjectId)}` : "";
    const res = await fetch(`/api/admin/site-pv${qs}`, { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as SitePv[]);
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
        r.object.toLowerCase().includes(q) ||
        SITE_PV_TYPE_LABELS[r.pvType].toLowerCase().includes(q),
    );
  }, [rows, search]);

  function resetForm() {
    setEditId(null);
    setPvType("reunion_chantier");
    setProjectId(defaultProjectId ?? filterProjectId ?? "");
    setPvDate(new Date().toISOString().slice(0, 10));
    setObject("");
    setObservations("");
    setDecisions("");
    setReserves("");
    setParticipantsText("");
    setActionsText("");
    setResponsiblePerson("");
    setDeadline("");
  }

  function openEdit(row: SitePv) {
    setEditId(row.id);
    setPvType(row.pvType);
    setProjectId(row.projectId ?? "");
    setPvDate(row.pvDate);
    setObject(row.object);
    setObservations(row.observations);
    setDecisions(row.decisions);
    setReserves(row.reserves);
    setParticipantsText(row.participants.map((p) => [p.name, p.role, p.company].filter(Boolean).join(" | ")).join("\n"));
    setActionsText(
      row.actions.map((a) => `${a.task} | ${a.responsible}${a.deadline ? ` | ${a.deadline}` : ""}`).join("\n"),
    );
    setResponsiblePerson(row.responsiblePerson);
    setDeadline(row.deadline ?? "");
    setTab("form");
  }

  function parseParticipants(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, role, company] = line.split("|").map((s) => s.trim());
        return { name: name || line, role, company };
      });
  }

  function parseActions(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [task, responsible, dl] = line.split("|").map((s) => s.trim());
        return { task: task || line, responsible: responsible || "", deadline: dl || undefined };
      });
  }

  async function save() {
    if (!object.trim()) {
      toast.error("Indiquez l'objet du PV.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/site-pv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId ?? undefined,
        pvType,
        projectId: projectId || null,
        pvDate,
        object,
        observations,
        decisions,
        reserves,
        participants: parseParticipants(participantsText),
        actions: parseActions(actionsText),
        responsiblePerson,
        deadline: deadline || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "PV mis à jour." : "PV créé.");
    resetForm();
    setTab("list");
    await load();
  }

  async function remove(id: string) {
    if (!(await confirmDelete("Supprimer ce procès-verbal ?"))) return;
    const res = await fetch(`/api/admin/site-pv?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("PV supprimé.");
    await load();
  }

  if (loading && tab === "list") {
    return embedded ? <AdminLoading /> : (
      <div className={moduleWrap}>
        <AdminLoading />
      </div>
    );
  }

  const wrapClass = embedded ? "space-y-4" : moduleWrap;

  return (
    <div className={wrapClass}>
      {!embedded ? (
      <OpsModuleHeader
        title="Procès-verbaux chantier"
        description="PV de réunion, visite, réception, matériel, incident — export PDF."
        actions={
          tab === "list" ? (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                resetForm();
                setTab("form");
              }}
            >
              Nouveau PV
            </button>
          ) : (
            <button type="button" className={btnSecondary} onClick={() => { resetForm(); setTab("list"); }}>
              Retour liste
            </button>
          )
        }
      />
      ) : tab === "list" ? (
        <div className="flex justify-end">
          <button type="button" className={btnPrimary} onClick={() => { resetForm(); setTab("form"); }}>
            Nouveau PV
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
          if (id === "list") resetForm();
          setTab(id as "list" | "form");
        }}
      />

      {tab === "list" ? (
        <div className="space-y-4">
          <AdminMiniStats
            items={[
              { label: "Total PV", value: String(rows.length) },
              { label: "Brouillons", value: String(rows.filter((r) => r.status === "draft").length) },
              { label: "Signés / acceptés", value: String(rows.filter((r) => r.status === "signed" || r.status === "accepted").length) },
            ]}
          />

          <AdminInventoryCard
            title="Procès-verbaux"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="N°, objet, type…"
          >
            <div className="border-b border-border px-4 py-3">
              <p className={labelClass}>Filtrer par chantier</p>
              <div className="mt-1 max-w-xs">
                <ProjectSelect
                  projects={projects}
                  value={filterProjectId}
                  onChange={setFilterProjectId}
                  allowEmpty
                  placeholder="— Tous les chantiers —"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                Aucun procès-verbal.
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => { resetForm(); setTab("form"); }}>
                  Nouveau PV
                </button>
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>N°</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Objet</th>
                    <th className={thClass}>Chantier</th>
                    <th className={thClass}>Statut</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const projectName = projects.find((p) => p.id === row.projectId)?.name ?? "—";
                    return (
                      <tr key={row.id} className={rowHover}>
                        <td className={`${tdClass} font-mono text-xs`}>{row.number}</td>
                        <td className={tdClass}>{SITE_PV_TYPE_LABELS[row.pvType]}</td>
                        <td className={tdClass}>{row.pvDate}</td>
                        <td className={tdClass}>{row.object}</td>
                        <td className={tdClass}>{projectName}</td>
                        <td className={tdClass}>{SITE_PV_STATUS_LABELS[row.status]}</td>
                        <td className={tdClass}>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`/api/admin/site-pv?id=${encodeURIComponent(row.id)}&format=pdf`}
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
                    );
                  })}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </div>
      ) : (
        <AdminFormCard
          title={editId ? "Modifier le PV" : "Nouveau procès-verbal"}
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Créer le PV"}
              </button>
              {editId ? (
                <a
                  href={`/api/admin/site-pv?id=${encodeURIComponent(editId)}&format=pdf`}
                  className={btnSecondary}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Télécharger PDF
                </a>
              ) : null}
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Type de PV *</p>
              <select className={`${inputClass} mt-1`} value={pvType} onChange={(e) => setPvType(e.target.value as SitePvType)}>
                {SITE_PV_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SITE_PV_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Date *</p>
              <input type="date" className={`${inputClass} mt-1`} value={pvDate} onChange={(e) => setPvDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Chantier</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Objet *</p>
              <input className={`${inputClass} mt-1`} value={object} onChange={(e) => setObject(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Participants (une ligne par personne : Nom | Rôle | Société)</p>
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={participantsText} onChange={(e) => setParticipantsText(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Observations</p>
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={observations} onChange={(e) => setObservations(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Décisions</p>
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={decisions} onChange={(e) => setDecisions(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Réserves</p>
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={reserves} onChange={(e) => setReserves(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Actions à mener (ligne : Tâche | Responsable | Échéance)</p>
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={actionsText} onChange={(e) => setActionsText(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Responsable suivi</p>
              <input className={`${inputClass} mt-1`} value={responsiblePerson} onChange={(e) => setResponsiblePerson(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Échéance globale</p>
              <input type="date" className={`${inputClass} mt-1`} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
        </AdminFormCard>
      )}

      {!embedded ? (
      <p className="text-xs text-[var(--graphite)]/65">
        Liens :{" "}
        <Link href="/admin/etats" className="underline">
          États ERP
        </Link>
        {" · "}
        <Link href="/admin/projets" className="underline">
          Projets
        </Link>
      </p>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
