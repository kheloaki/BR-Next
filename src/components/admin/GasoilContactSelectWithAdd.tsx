"use client";

import { useMemo, useState } from "react";
import type { AdminProject, GasoilContact, GasoilContactRole } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  formGridClass,
  inputClass,
  inputClassDense,
  labelClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { contactMatchesProject, formatGasoilContactLabel } from "@/lib/admin/map-gasoil-contact";
import { readApiError } from "@/components/admin/ux/useAdminToast";

const ROLE_LABELS: Record<GasoilContactRole, string> = {
  conducteur: "conducteur",
  pompiste: "pompiste",
};

export function GasoilContactSelectWithAdd({
  role,
  contacts,
  value,
  onChange,
  onContactAdded,
  projects = [],
  defaultProjectIds = [],
  projectFilterId,
  placeholder = "— Sélectionner —",
  compact = false,
  standardInput = false,
  label,
}: {
  role: GasoilContactRole;
  contacts: GasoilContact[];
  value: string;
  onChange: (contactId: string, name: string) => void;
  onContactAdded?: (contact: GasoilContact) => void;
  projects?: AdminProject[];
  /** Chantiers pré-cochés à la création (ex. chantier du formulaire). */
  defaultProjectIds?: string[];
  /** Limite la liste aux conducteurs rattachés à ce chantier (ou sans chantier). */
  projectFilterId?: string;
  placeholder?: string;
  compact?: boolean;
  standardInput?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCin, setNewCin] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newProjectIds, setNewProjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectNameMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) => c.role === role && (role !== "conducteur" || contactMatchesProject(c, projectFilterId)),
      ),
    [contacts, role, projectFilterId],
  );

  const inputCls = compact ? inputClassDense : inputClass;
  const selectCls = standardInput
    ? `${inputCls} min-w-0 flex-1`
    : `${inputCls} min-w-0 flex-1 border-0 border-b border-dotted border-[var(--navy)]/40 bg-transparent px-0`;

  function toggleProject(projectId: string) {
    setNewProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  }

  function resetForm() {
    setNewName("");
    setNewCin("");
    setNewJobTitle("");
    setNewProjectIds(defaultProjectIds.filter(Boolean));
  }

  async function submitContact() {
    const name = newName.trim();
    if (!name) {
      setError("Indiquez le nom.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/gasoil-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        name,
        cin: role === "conducteur" ? newCin.trim() : undefined,
        jobTitle: role === "conducteur" ? newJobTitle.trim() : undefined,
        projectIds: role === "conducteur" ? newProjectIds : undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as GasoilContact;
    onChange(created.id, created.name);
    onContactAdded?.(created);
    resetForm();
    setOpen(false);
  }

  return (
    <>
      {label ? <p className={labelClass}>{label}</p> : null}
      <div className={`flex gap-2 ${label ? "mt-1" : ""}`}>
        <select
          className={selectCls}
          value={value}
          onChange={(e) => {
            const id = e.target.value;
            const contact = filtered.find((c) => c.id === id);
            onChange(id, contact?.name ?? "");
          }}
        >
          <option value="">{placeholder}</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {role === "conducteur"
                ? formatGasoilContactLabel(c, projectNameMap)
                : c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-2.5 py-1 text-sm`}
          onClick={() => {
            setError(null);
            resetForm();
            setOpen(true);
          }}
          title={`Ajouter un ${ROLE_LABELS[role]}`}
          aria-label={`Ajouter un ${ROLE_LABELS[role]}`}
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Nouveau ${ROLE_LABELS[role]}`}
        description={
          role === "conducteur"
            ? "Enregistré dans le carnet conducteurs — réutilisable sur bons gasoil et matériel."
            : "Nom et prénom — enregistré pour les prochains bons gasoil."
        }
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitContact()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        {role === "conducteur" ? (
          <div className={formGridClass}>
            <AdminSheetField label="Nom, prénom" required className="sm:col-span-2">
              <input
                className={inputClass}
                placeholder="Nom complet"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </AdminSheetField>
            <AdminSheetField label="N° CIN">
              <input
                className={inputClass}
                placeholder="Carte d'identité nationale"
                value={newCin}
                onChange={(e) => setNewCin(e.target.value)}
              />
            </AdminSheetField>
            <AdminSheetField label="Poste / fonction">
              <input
                className={inputClass}
                placeholder="Ex. Conducteur d'engin"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
              />
            </AdminSheetField>
            {projects.length > 0 ? (
              <AdminSheetField
                label="Chantier(s)"
                className="sm:col-span-2"
                hint="Un ou plusieurs chantiers — laisser vide = tous."
              >
                <div className="flex flex-wrap gap-1.5">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={
                        newProjectIds.includes(p.id) ? categorySegmentBtnSelected : categorySegmentBtnUnselected
                      }
                      onClick={() => toggleProject(p.id)}
                    >
                      {p.code ? `${p.code} — ${p.name}` : p.name}
                    </button>
                  ))}
                </div>
              </AdminSheetField>
            ) : null}
          </div>
        ) : (
          <AdminSheetField label="Nom, prénom" required>
            <input
              className={inputClass}
              placeholder="Nom complet"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitContact();
              }}
            />
          </AdminSheetField>
        )}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
