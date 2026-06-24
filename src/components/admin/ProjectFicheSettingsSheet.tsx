"use client";

import { useEffect, useState } from "react";
import { ProjectDocumentUpload } from "@/components/admin/ProjectDocumentUpload";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import {
  PROJECT_STATUS_LABELS,
  type AdminProject,
  type AdminProjectForm,
  type ProjectStatus,
} from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import {
  ALL_PROJECT_FICHE_SECTION_IDS,
  normalizeFicheVisibleSections,
  PROJECT_FICHE_SECTION_GROUPS,
  type ProjectFicheSectionId,
} from "@/lib/admin/project-fiche-sections";

const STATUSES: ProjectStatus[] = ["active", "inactive"];

function projectToForm(p: AdminProject): AdminProjectForm {
  return {
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
  };
}

export function ProjectFicheSettingsSheet({
  open,
  onClose,
  project,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  project: AdminProject;
  onSaved: (updated: AdminProject) => void;
}) {
  const toast = useAdminToast();
  const [tab, setTab] = useState<"info" | "visibility">("info");
  const [form, setForm] = useState<AdminProjectForm>(() => projectToForm(project));
  const [visibleSections, setVisibleSections] = useState<ProjectFicheSectionId[]>(() =>
    project.ficheVisibleSections?.length
      ? [...project.ficheVisibleSections]
      : [...ALL_PROJECT_FICHE_SECTION_IDS],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(projectToForm(project));
    setVisibleSections(
      project.ficheVisibleSections?.length
        ? [...project.ficheVisibleSections]
        : [...ALL_PROJECT_FICHE_SECTION_IDS],
    );
    setTab("info");
  }, [open, project]);

  function toggleSection(id: ProjectFicheSectionId) {
    setVisibleSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function selectAllSections() {
    setVisibleSections([...ALL_PROJECT_FICHE_SECTION_IDS]);
  }

  async function save() {
    const name = form.name.trim() || [form.code.trim(), form.clientName.trim()].filter(Boolean).join(" — ");
    if (!name) {
      toast.error("Indiquez au minimum la réf. projet ou l'entreprise.");
      return;
    }
    if (visibleSections.length === 0) {
      toast.error("Sélectionnez au moins une section visible.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: project.id,
        ...form,
        name,
        ficheVisibleSections: normalizeFicheVisibleSections(visibleSections),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }

    const updated = (await res.json()) as AdminProject;
    toast.success("Paramètres projet enregistrés.");
    onSaved(updated);
    onClose();
  }

  return (
    <>
      <AdminDataSheet
        open={open}
        onClose={onClose}
        title="Paramètres du projet"
        description={`${project.name}${project.code ? ` · ${project.code}` : ""}`}
        footer={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={onClose}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        }
      >
        <div className="mb-4 flex gap-2 border-b border-border pb-3">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "info" ? "bg-[var(--navy)] text-white" : "text-[var(--graphite)]/80 hover:bg-[var(--background)]"}`}
            onClick={() => setTab("info")}
          >
            Informations
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === "visibility" ? "bg-[var(--navy)] text-white" : "text-[var(--graphite)]/80 hover:bg-[var(--background)]"}`}
            onClick={() => setTab("visibility")}
          >
            Sections visibles
          </button>
        </div>

        {tab === "info" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminSheetField label="Réf. projet">
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Statut">
              <SearchableEnumSelect
                options={Object.fromEntries(STATUSES.map((s) => [s, PROJECT_STATUS_LABELS[s]]))}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}
                inputClassName={inputClass}
                allowEmpty={false}
              />
            </AdminSheetField>
            <AdminSheetField label="Intitulé" className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Entreprise / client">
              <input
                className={inputClass}
                value={form.clientName}
                onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Responsable">
              <input
                className={inputClass}
                value={form.managerName}
                onChange={(e) => setForm((f) => ({ ...f, managerName: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="N° marché">
              <input
                className={inputClass}
                value={form.marketNumber}
                onChange={(e) => setForm((f) => ({ ...f, marketNumber: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Budget (MAD)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.budgetMad || ""}
                onChange={(e) => setForm((f) => ({ ...f, budgetMad: Number(e.target.value) || 0 }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Début">
              <input
                type="date"
                className={inputClass}
                value={form.startDate?.slice(0, 10) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value || null }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Fin">
              <input
                type="date"
                className={inputClass}
                value={form.endDate?.slice(0, 10) ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Localisation" className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Adresse" className="sm:col-span-2">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Description marché" className="sm:col-span-2">
              <textarea
                className={inputClass}
                rows={2}
                value={form.marketDescription}
                onChange={(e) => setForm((f) => ({ ...f, marketDescription: e.target.value }))}
              />
            </AdminSheetField>
            <AdminSheetField label="Document chantier" className="sm:col-span-2">
              <ProjectDocumentUpload
                label="Document chantier"
                value={form.chantierDocumentUrl}
                onChange={(url) => setForm((f) => ({ ...f, chantierDocumentUrl: url }))}
                uploadPrefix={`projects/${project.id}/chantier`}
                disabled={saving}
              />
            </AdminSheetField>
            <AdminSheetField label="Plan" className="sm:col-span-2">
              <ProjectDocumentUpload
                label="Plan"
                value={form.planUrl}
                onChange={(url) => setForm((f) => ({ ...f, planUrl: url }))}
                uploadPrefix={`projects/${project.id}/plan`}
                disabled={saving}
              />
            </AdminSheetField>
            <AdminSheetField label="Notes" className="sm:col-span-2">
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </AdminSheetField>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-[var(--graphite)]/75">
              Choisissez les blocs affichés sur la fiche projet pour le propriétaire et l&apos;équipe.
            </p>
            <button type="button" className={btnSecondary} onClick={selectAllSections}>
              Tout afficher
            </button>
            {PROJECT_FICHE_SECTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]/65">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-[var(--background)]/80">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={visibleSections.includes(section.id)}
                          onChange={() => toggleSection(section.id)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-[var(--navy)]">{section.label}</span>
                          <span className="text-xs text-[var(--graphite)]/70">{section.description}</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </AdminDataSheet>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );
}
