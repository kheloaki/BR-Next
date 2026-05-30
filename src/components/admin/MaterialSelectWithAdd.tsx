"use client";

import { useState } from "react";
import type { RentalMaterial } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import { btnPrimary, btnSecondary, formGridClass, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import {
  EMPTY_RENTAL_MATERIAL_FORM,
  RentalMaterialFormFields,
  validateRentalMaterialForm,
} from "@/components/admin/RentalMaterialFormFields";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";

export function MaterialSelectWithAdd({
  materials,
  value,
  onChange,
  onMaterialAdded,
  label = "Matériel *",
  placeholder = "— Sélectionner un matériel —",
}: {
  materials: RentalMaterial[];
  value: string;
  onChange: (id: string) => void;
  onMaterialAdded?: (material: RentalMaterial) => void | Promise<void>;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_RENTAL_MATERIAL_FORM);

  const activeMaterials = materials.filter((m) => m.active);

  async function submitMaterial() {
    const err = validateRentalMaterialForm(form);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/rental-materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as RentalMaterial;
    onChange(created.id);
    await onMaterialAdded?.(created);
    setForm(EMPTY_RENTAL_MATERIAL_FORM);
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
          <option value="">{placeholder}</option>
          {activeMaterials.map((m) => (
            <option key={m.id} value={m.id}>
              [{MATERIAL_CATEGORY_LABELS[m.materialCategory]}] {materialLabel(m)}
              {m.ownerName ? ` · ${m.ownerName}` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            setForm(EMPTY_RENTAL_MATERIAL_FORM);
            setError(null);
            setOpen(true);
          }}
          title="Créer un matériel"
          aria-label="Créer un matériel"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau matériel"
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitMaterial()}>
              {saving ? "Enregistrement…" : "Enregistrer le matériel"}
            </button>
          </>
        }
      >
        <div className={formGridClass}>
          <RentalMaterialFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
