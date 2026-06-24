"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { withEmptyOption } from "@/components/admin/searchable-options";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { ProjectDocumentUpload } from "@/components/admin/ProjectDocumentUpload";
import {
  PROJECT_STATUS_LABELS,
  type AdminProject,
  type AdminProjectForm,
  type ProjectFinancialSummary,
  type ProjectStatus,
} from "@/components/admin/operations-types";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  btnSecondary,
  card,
  inputClass,
  moduleWrap,
} from "@/components/admin/admin-form-styles";
import { AdminEmptyState } from "@/components/admin/ux/AdminEmptyState";
import { AdminFilterBar } from "@/components/admin/ux/AdminFilterBar";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { ProjectsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

const STATUSES: ProjectStatus[] = ["active", "inactive"];

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  inactive: "bg-[var(--graphite)]/10 text-[var(--graphite)] border border-border",
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const emptyForm = (): AdminProjectForm => ({
  code: "",
  name: "",
  clientName: "",
  status: "active",
  startDate: null,
  endDate: null,
  location: "",
  address: "",
  managerName: "",
  marketNumber: "",
  marketDescription: "",
  chantierDocumentUrl: "",
  planUrl: "",
  notes: "",
  budgetMad: 0,
  ficheVisibleSections: null,
});

type ProjectListRow = AdminProject & { financials?: ProjectFinancialSummary };

function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--graphite)]/70">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ProjectsManager() {
  const toast = useAdminToast();
  const [rows, setRows] = useState<ProjectListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tab, setTab] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    const url = statusFilter
      ? `/api/admin/projects?status=${encodeURIComponent(statusFilter)}&financials=1`
      : "/api/admin/projects?financials=1";
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as ProjectListRow[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.marketNumber.toLowerCase().includes(q) ||
        p.managerName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const statusFilterOptions = useMemo(
    () => withEmptyOption(STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })), "Tous statuts"),
    [],
  );

  const activeCount = rows.filter((p) => p.status === "active").length;

  function openCreate() {
    setEditId(null);
    setForm(emptyForm());
    setTab("form");
  }

  function openEdit(p: AdminProject) {
    setEditId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      clientName: p.clientName,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      location: p.location,
      address: p.address,
      managerName: p.managerName,
      marketNumber: p.marketNumber,
      marketDescription: p.marketDescription,
      chantierDocumentUrl: p.chantierDocumentUrl,
      planUrl: p.planUrl,
      notes: p.notes,
      budgetMad: p.budgetMad,
      ficheVisibleSections: p.ficheVisibleSections,
    });
    setTab("form");
  }

  async function save() {
    const name = form.name.trim() || [form.code.trim(), form.clientName.trim()].filter(Boolean).join(" — ");
    if (!name) {
      toast.error("Indiquez au minimum la réf. projet ou l'entreprise.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId ?? undefined, ...form, name }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Projet mis à jour." : "Projet créé.");
    await load();
    setTab("list");
  }

  async function remove(p: AdminProject) {
    if (!(await confirmDelete(p.name))) return;
    const res = await fetch(`/api/admin/projects?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Projet supprimé.");
    await load();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Projets (chantiers)"
        description="Chaque projet regroupe production, foration, carburant et RH — ouvrez la fiche pour le tableau de bord."
        actions={
          <>
            <button type="button" className={btnPrimary} onClick={openCreate}>
              Nouveau projet
            </button>
          </>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Projets", value: String(rows.length) },
            { label: "Actifs", value: String(activeCount) },
            {
              label: "Inactifs",
              value: String(rows.filter((p) => p.status === "inactive").length),
            },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "list", label: "Cartes", badge: rows.length || undefined },
          { id: "form", label: editId ? "Modifier" : "Nouveau" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as "list" | "form")}
      />

      {loading ? <ProjectsPageSkeleton partial /> : null}

      {!loading && tab === "list" ? (
        <>
          <AdminFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Nom, code, client…">
            <SearchableEnumSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              inputClassName={`${inputClass} max-w-[180px]`}
              placeholder="Tous statuts"
            />
          </AdminFilterBar>

          {filtered.length === 0 ? (
            <AdminEmptyState
              title="Aucun projet"
              description="Créez votre premier chantier pour centraliser les rapports opérationnels."
              actionLabel="Nouveau projet"
              onAction={openCreate}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => void remove(p)}
                />
              ))}
            </div>
          )}
        </>
      ) : null}

      {!loading && tab === "form" ? (
        <AdminFormCard
          title={editId ? "Modifier le projet" : "Nouveau projet"}
          hint="Référence, entreprise, marché et documents chantier."
          footer={
            <div className="flex gap-2">
              <button type="button" className={btnSecondary} onClick={() => setTab("list")}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          }
        >
          <div className="grid max-w-3xl gap-6 md:grid-cols-2">
            <FormField label="Réf. projet">
              <input
                className={inputClass}
                placeholder="ex. CH-2026-01"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </FormField>
            <FormField label="Statut">
              <SearchableEnumSelect
                options={Object.fromEntries(STATUSES.map((s) => [s, PROJECT_STATUS_LABELS[s]]))}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}
                inputClassName={inputClass}
                allowEmpty={false}
              />
            </FormField>
            <FormField label="Intitulé chantier" className="md:col-span-2">
              <input
                className={inputClass}
                placeholder="Libellé affiché (sinon réf. + entreprise)"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </FormField>
            <FormField label="Entreprise">
              <input
                className={inputClass}
                placeholder="Maître d'ouvrage / client"
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              />
            </FormField>
            <FormField label="Budget projet (MAD)">
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                placeholder="Montant du marché / contrat"
                value={form.budgetMad || ""}
                onChange={(e) => setForm((f) => ({ ...f, budgetMad: Number(e.target.value) || 0 }))}
              />
            </FormField>
            <FormField label="Responsable">
              <input
                className={inputClass}
                placeholder="Nom du responsable chantier"
                value={form.managerName}
                onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
              />
            </FormField>
            <FormField label="Adresse" className="md:col-span-2">
              <input
                className={inputClass}
                placeholder="Adresse du chantier"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </FormField>
            <FormField label="N° marché">
              <input
                className={inputClass}
                placeholder="Numéro de marché"
                value={form.marketNumber}
                onChange={(e) => setForm((f) => ({ ...f, marketNumber: e.target.value }))}
              />
            </FormField>
            <FormField label="Région / zone">
              <input
                className={inputClass}
                placeholder="Optionnel"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </FormField>
            <FormField label="Description marché" className="md:col-span-2">
              <textarea
                className={inputClass}
                rows={4}
                placeholder="Objet du marché, périmètre, observations…"
                value={form.marketDescription}
                onChange={(e) => setForm((f) => ({ ...f, marketDescription: e.target.value }))}
              />
            </FormField>
            <div className="space-y-4 border-t border-border pt-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--graphite)]/70">
                Documents
              </p>
              <ProjectDocumentUpload
                label="Document chantier"
                value={form.chantierDocumentUrl}
                onChange={(url) => setForm((f) => ({ ...f, chantierDocumentUrl: url }))}
                uploadPrefix={`projects/${editId ?? "new"}/chantier`}
                disabled={saving}
              />
              <ProjectDocumentUpload
                label="Plan"
                value={form.planUrl}
                onChange={(url) => setForm((f) => ({ ...f, planUrl: url }))}
                uploadPrefix={`projects/${editId ?? "new"}/plan`}
                disabled={saving}
              />
            </div>
            <FormField label="Date début">
              <input
                type="date"
                className={inputClass}
                value={form.startDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))}
              />
            </FormField>
            <FormField label="Date fin">
              <input
                type="date"
                className={inputClass}
                value={form.endDate ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))}
              />
            </FormField>
            <FormField label="Notes internes" className="md:col-span-2">
              <textarea
                className={inputClass}
                rows={2}
                placeholder="Notes (non visibles sur les exports)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </FormField>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}

function ProjectCard({
  project: p,
  onEdit,
  onDelete,
}: {
  project: ProjectListRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hubHref = `/admin/projets/${p.id}`;
  const fin = p.financials;
  const period =
    p.startDate || p.endDate
      ? [formatDate(p.startDate), formatDate(p.endDate)].filter(Boolean).join(" → ")
      : null;

  return (
    <article
      className={`${card} group flex flex-col p-0 overflow-hidden transition hover:border-[var(--gold)]/45 hover:shadow-md`}
    >
      <Link href={hubHref} className="flex flex-1 flex-col p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {p.code ? (
              <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--graphite)]/60">
                {p.code}
              </p>
            ) : null}
            <h3 className="mt-1 text-base font-semibold leading-snug text-[var(--navy)] group-hover:text-[var(--navy-deep)]">
              {p.name}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status]}`}
          >
            {PROJECT_STATUS_LABELS[p.status]}
          </span>
        </div>

        <ul className="mt-3 space-y-1.5 text-sm text-[var(--graphite)]/85">
          {p.clientName ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Entreprise</span>
              <span className="truncate font-medium text-[var(--navy)]">{p.clientName}</span>
            </li>
          ) : null}
          {p.marketNumber ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Marché</span>
              <span className="truncate font-mono text-xs">{p.marketNumber}</span>
            </li>
          ) : null}
          {p.address ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Adresse</span>
              <span className="truncate">{p.address}</span>
            </li>
          ) : null}
          {p.location ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Zone</span>
              <span className="truncate">{p.location}</span>
            </li>
          ) : null}
          {p.managerName ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Resp.</span>
              <span className="truncate">{p.managerName}</span>
            </li>
          ) : null}
          {period ? (
            <li className="flex gap-2">
              <span className="shrink-0 text-[var(--graphite)]/55">Période</span>
              <span className="truncate">{period}</span>
            </li>
          ) : null}
          {fin ? (
            <li className="mt-2 grid grid-cols-1 gap-2 rounded-md border border-border bg-[var(--background)]/50 px-2 py-2 text-xs sm:grid-cols-3">
              <div>
                <p className="text-[var(--graphite)]/55">Budget</p>
                <p className="font-semibold text-[var(--navy)]">{formatMoney(fin.budgetMad)}</p>
              </div>
              <div>
                <p className="text-[var(--graphite)]/55">Payé</p>
                <p className="font-semibold text-emerald-800">{formatMoney(fin.montantPaye)}</p>
              </div>
              <div>
                <p className="text-[var(--graphite)]/55">Marge</p>
                <p
                  className={`font-semibold ${fin.margeMad >= 0 ? "text-emerald-800" : "text-red-700"}`}
                >
                  {formatMoney(fin.margeMad)}
                </p>
              </div>
            </li>
          ) : null}
        </ul>

        {!p.clientName && !p.address && !p.location && !p.managerName && !p.marketNumber && !period ? (
          <p className="mt-3 text-sm text-[var(--graphite)]/55">Ouvrir la fiche projet →</p>
        ) : null}
      </Link>

      <div className="flex items-center gap-1 border-t border-border bg-[var(--background)]/40 px-2 py-2">
        <Link href={hubHref} className={`${btnGhost} min-h-[36px] flex-1 text-xs`}>
          Fiche projet
        </Link>
        <button
          type="button"
          className={`${btnGhost} min-h-[36px] px-2 text-xs`}
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          Modifier
        </button>
        <button
          type="button"
          className={`${btnDanger} min-h-[36px] px-2 text-xs`}
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          Supprimer
        </button>
      </div>
    </article>
  );
}
