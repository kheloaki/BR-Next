"use client";

import { useMemo, useState } from "react";
import type { FinanceCategory, FinanceCategoryDirection } from "@/lib/admin/finance-types";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function FinanceCategorySelectWithAdd({
  categories,
  value,
  onChange,
  onCategoryAdded,
  direction = "expense",
  placeholder = "— Catégorie —",
  label = "Catégorie",
}: {
  categories: FinanceCategory[];
  value: string;
  onChange: (categoryId: string) => void;
  onCategoryAdded?: (category: FinanceCategory) => void;
  direction?: FinanceCategoryDirection;
  placeholder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo((): SearchableSelectOption[] => {
    return categories.map((c) => ({ value: c.id, label: c.name }));
  }, [categories]);

  async function submitCategory() {
    const name = newName.trim();
    if (!name) {
      setError("Indiquez le nom de la catégorie.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, direction }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as FinanceCategory;
    onChange(created.id);
    onCategoryAdded?.(created);
    setNewName("");
    setOpen(false);
  }

  return (
    <>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex gap-2">
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
        title="Nouvelle catégorie de dépense"
        description="Ex. Gasoil, Transport, Maintenance…"
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
        <AdminSheetField label="Nom" required>
          <input
            className={inputClass}
            placeholder="Ex. Gasoil, Transport…"
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
