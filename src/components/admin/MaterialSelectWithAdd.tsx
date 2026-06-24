"use client";

import { useMemo, useState } from "react";
import type {
  AdminProject,
  GasoilContact,
  MaterialDetailCategory,
  RentalMaterial,
} from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
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
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function MaterialSelectWithAdd({
  materials,
  value,
  onChange,
  onMaterialAdded,
  projects = [],
  suppliers = [],
  gasoilContacts = [],
  materialDetailCategories = [],
  onMaterialDetailCategoriesChange,
  onSuppliersChange,
  onGasoilContactsChange,
  label = "Matériel *",
  placeholder = "— Sélectionner un matériel —",
}: {
  materials: RentalMaterial[];
  value: string;
  onChange: (id: string) => void;
  onMaterialAdded?: (material: RentalMaterial) => void | Promise<void>;
  projects?: AdminProject[];
  suppliers?: Supplier[];
  gasoilContacts?: GasoilContact[];
  materialDetailCategories?: MaterialDetailCategory[];
  onMaterialDetailCategoriesChange?: (cats: MaterialDetailCategory[]) => void;
  onSuppliersChange?: (suppliers: Supplier[]) => void;
  onGasoilContactsChange?: (contacts: GasoilContact[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_RENTAL_MATERIAL_FORM);

  const activeMaterials = materials.filter((m) => m.active);

  const options = useMemo((): SearchableSelectOption[] => {
    return activeMaterials.map((m) => ({
      value: m.id,
      label: `[${MATERIAL_CATEGORY_LABELS[m.materialCategory]}] ${materialLabel(m)}${m.ownerName ? ` · ${m.ownerName}` : ""}`,
      keywords: `${materialLabel(m)} ${m.ownerName ?? ""} ${m.matricule ?? ""} ${m.reference ?? ""}`,
    }));
  }, [activeMaterials]);

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
      body: JSON.stringify({
        ...form,
        projectId: form.projectId || null,
        supplierId: form.supplierId || null,
        driverContactId: form.driverContactId || null,
        employeeId: null,
      }),
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
              {saving ? "Enregistrement…" : "Enregistrer le matériel"
              }
            </button>
          </>
        }
      >
        <div className={formGridClass}>
          <RentalMaterialFormFields
            values={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            projects={projects}
            suppliers={suppliers}
            gasoilContacts={gasoilContacts}
            materialDetailCategories={materialDetailCategories}
            onSupplierAdded={(supplier) =>
              onSuppliersChange?.(
                suppliers.some((s) => s.id === supplier.id) ? suppliers : [...suppliers, supplier],
              )
            }
            onGasoilContactAdded={(contact) =>
              onGasoilContactsChange?.(
                gasoilContacts.some((c) => c.id === contact.id) ? gasoilContacts : [...gasoilContacts, contact],
              )
            }
            onMaterialDetailCategoriesChange={onMaterialDetailCategoriesChange}
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
