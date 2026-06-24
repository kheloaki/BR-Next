"use client";

import { useMemo, useState } from "react";
import type { PersonnelCategory } from "@/components/admin/operations-types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function PersonnelCategorySelectWithAdd({
  categories,
  value,
  onChange,
  onCategoryAdded,
  allowEmpty = true,
  placeholder = "Poste / fonction…",
  label,
}: {
  categories: PersonnelCategory[];
  value: string;
  onChange: (name: string) => void;
  onCategoryAdded?: (category: PersonnelCategory) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo((): SearchableSelectOption[] => {
    return categories.map((c) => ({ value: c.name, label: c.name }));
  }, [categories]);

  async function submitCategory() {
    const name = newName.trim();
    if (!name) {
      setError("Indiquez le nom du poste.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/personnel-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as PersonnelCategory;
    onChange(created.name);
    onCategoryAdded?.(created);
    setNewName("");
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
          allowEmpty={allowEmpty}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            setError(null);
            setNewName("");
            setOpen(true);
          }}
          title="Ajouter un poste"
          aria-label="Ajouter un poste"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau poste / fonction"
        description="Ex. Chauffeur, Mécanicien, Conducteur d'engin…"
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitCategory()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <AdminSheetField label="Nom du poste" required>
          <input
            className={inputClass}
            placeholder="Ex. Chauffeur, Mécanicien…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCategory();
            }}
          />
        </AdminSheetField>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
