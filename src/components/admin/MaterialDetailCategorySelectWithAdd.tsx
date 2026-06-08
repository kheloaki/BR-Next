"use client";

import { useMemo, useState } from "react";
import type { MaterialCategory, MaterialDetailCategory } from "@/components/admin/operations-types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";

const HINTS: Partial<Record<MaterialCategory, string>> = {
  engin: "Ex. Pelle, Compacteur, Chargeuse…",
  camion: "Ex. 8x4, 6x4, Benne, Semi-remorque…",
  groupe_electrogen: "Ex. 100 kVA, 250 kVA…",
};

export function MaterialDetailCategorySelectWithAdd({
  materialCategory,
  categories,
  value,
  onChange,
  onCategoryAdded,
  label = "Catégorie détaillée",
}: {
  materialCategory: MaterialCategory;
  categories: MaterialDetailCategory[];
  value: string;
  onChange: (name: string) => void;
  onCategoryAdded?: (category: MaterialDetailCategory) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => categories.filter((c) => c.materialCategory === materialCategory),
    [categories, materialCategory],
  );

  async function submitCategory() {
    const name = newName.trim();
    if (!name) {
      setError("Indiquez le nom de la catégorie.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/material-detail-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialCategory, name }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as MaterialDetailCategory;
    onChange(created.name);
    onCategoryAdded?.(created);
    setNewName("");
    setOpen(false);
  }

  return (
    <>
      {label ? <p className={labelClass}>{label}</p> : null}
      <div className={`flex gap-2 ${label ? "mt-1" : ""}`}>
        <select
          className={`${inputClass} min-w-0 flex-1`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Sélectionner —</option>
          {filtered.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
          {value && !filtered.some((c) => c.name === value) ? (
            <option value={value}>{value}</option>
          ) : null}
        </select>
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            setError(null);
            setNewName("");
            setOpen(true);
          }}
          title="Ajouter une catégorie"
          aria-label="Ajouter une catégorie"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle catégorie détaillée"
        description={HINTS[materialCategory]}
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
        <AdminSheetField label="Nom de la catégorie" required>
          <input
            className={inputClass}
            placeholder={HINTS[materialCategory] ?? "Nom de la catégorie"}
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
