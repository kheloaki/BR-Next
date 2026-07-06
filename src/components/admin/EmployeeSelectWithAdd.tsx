"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminEmployee, AdminProject, PersonnelCategory } from "@/components/admin/operations-types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { PersonnelCategorySelectWithAdd } from "@/components/admin/PersonnelCategorySelectWithAdd";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";

export function EmployeeSelectWithAdd({
  employees,
  categories,
  projects = [],
  value,
  onChange,
  onEmployeeAdded,
  onCategoriesChange,
  label = "Collaborateur",
  placeholder = "— Sélectionner —",
}: {
  employees: AdminEmployee[];
  categories: PersonnelCategory[];
  projects?: AdminProject[];
  value: string;
  onChange: (id: string) => void;
  onEmployeeAdded?: (employee: AdminEmployee) => void | Promise<void>;
  onCategoriesChange?: (categories: PersonnelCategory[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cin, setCin] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const cats = onCategoriesChange ? categories : localCategories;

  const options = useMemo((): SearchableSelectOption[] => {
    return employees.map((e) => ({
      value: e.id,
      label: `${e.cin ? `${e.cin} — ` : ""}${e.name}${e.role ? ` (${e.role})` : ""}`,
      keywords: `${e.cin ?? ""} ${e.name} ${e.role ?? ""} ${e.address ?? ""}`,
    }));
  }, [employees]);

  function updateCategories(next: PersonnelCategory[]) {
    setLocalCategories(next);
    onCategoriesChange?.(next);
  }

  function resetForm() {
    setCin("");
    setName("");
    setRole("");
    setAddress("");
    setBirthDate("");
    setProjectId("");
    setError(null);
  }

  async function submitEmployee() {
    if (!name.trim()) {
      setError("Indiquez le nom du collaborateur.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cin: cin.trim(),
        name: name.trim(),
        role: role.trim(),
        address: address.trim(),
        birthDate: birthDate || null,
        defaultProjectId: projectId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as AdminEmployee;
    onChange(created.id);
    await onEmployeeAdded?.(created);
    resetForm();
    setOpen(false);
  }

  return (
    <>
      {label ? <p className={labelClass}>{label}</p> : null}
      <div className={`flex gap-2 ${label ? "mt-1" : ""}`}>
        <SearchableSelect
          options={options}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          title="Ajouter un collaborateur"
          aria-label="Ajouter un collaborateur"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau collaborateur"
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitEmployee()}>
              {saving ? "Enregistrement…" : "Ajouter au personnel"}
            </button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={labelClass}>N° CIN</p>
            <input
              className={`${inputClass} mt-1`}
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              placeholder="Carte d'identité nationale"
            />
          </div>
          <div>
            <p className={labelClass}>Nom & prénom *</p>
            <input
              className={`${inputClass} mt-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <PersonnelCategorySelectWithAdd
              label="Poste / fonction"
              categories={cats}
              value={role}
              onChange={setRole}
              onCategoryAdded={(c) => updateCategories([...cats, c])}
            />
          </div>
          <div className="sm:col-span-2">
            <p className={labelClass}>Adresse</p>
            <input
              className={`${inputClass} mt-1`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div>
            <p className={labelClass}>Date de naissance</p>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          {projects.length > 0 ? (
            <div className="sm:col-span-2">
              <p className={labelClass}>Chantier par défaut</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
              </div>
            </div>
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
