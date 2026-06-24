"use client";

import { useState } from "react";
import type { ProductCategory } from "@/components/admin/devis-types";
import { btnPrimary, btnSecondary, btnSecondarySm, inputClass } from "@/components/admin/admin-form-styles";
import { ProductCategorySelect } from "@/components/admin/ProductCategorySelect";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";

type Props = {
  categories: ProductCategory[];
  value: string;
  onChange: (name: string) => void;
  onCategoryAdded?: (category: ProductCategory) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  compact?: boolean;
};

export function ProductCategorySelectWithAdd({
  categories,
  value,
  onChange,
  onCategoryAdded,
  allowEmpty = true,
  placeholder = "Catégorie…",
  compact = false,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitCategory() {
    if (!newName.trim()) {
      setError("Indiquez un nom de catégorie.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as ProductCategory;
    onCategoryAdded?.(created);
    onChange(created.name);
    setNewName("");
    setSheetOpen(false);
  }

  const addBtnClass = compact ? `${btnSecondarySm} shrink-0 min-h-[36px] px-2` : `${btnSecondary} shrink-0 px-3`;

  return (
    <>
      <div className="flex min-w-0 gap-1.5">
        <div className="min-w-0 flex-1">
          <ProductCategorySelect
            categories={categories}
            value={value}
            onChange={onChange}
            allowEmpty={allowEmpty}
            placeholder={placeholder}
            className={compact ? "min-h-[36px] py-1.5 text-sm" : undefined}
          />
        </div>
        <button
          type="button"
          className={addBtnClass}
          onClick={() => {
            setError(null);
            setNewName("");
            setSheetOpen(true);
          }}
          title="Nouvelle catégorie"
          aria-label="Nouvelle catégorie"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Nouvelle catégorie"
        description="Enregistrée dans le catalogue — sélectionnée automatiquement pour cet article."
        zIndex={210}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setSheetOpen(false)} disabled={saving}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitCategory()}>
              {saving ? "Enregistrement…" : "Ajouter"}
            </button>
          </>
        }
      >
        <AdminSheetField label="Nom" required>
          <input
            className={inputClass}
            placeholder="ex. Modulaires, Structures, Services…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitCategory();
              }
            }}
          />
        </AdminSheetField>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
