"use client";

import { FrenchDateInput } from "@/components/admin/FrenchDateTimeInput";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type { AdminProject } from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import { SupplierSelectWithAdd } from "@/components/admin/SupplierSelectWithAdd";
import { formGridClass, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import type { GasoilBonFormState } from "@/components/admin/FuelGasoilBonForm";

type Props = {
  form: GasoilBonFormState;
  onChange: (patch: Partial<GasoilBonFormState>) => void;
  projects: AdminProject[];
  suppliers: Supplier[];
  onSupplierAdded: (supplier: Supplier) => void;
  /** Inside AdminDataSheet — hide duplicate header card */
  embedded?: boolean;
  lockBonNumber?: boolean;
};

export function FuelGasoilBonCommandeForm({
  form,
  onChange,
  projects,
  suppliers,
  onSupplierAdded,
  embedded,
}: Props) {
  const fields = (
    <div className={embedded ? formGridClass : `${formGridClass} mt-4`}>
        <div className="sm:col-span-2">
          <p className={labelClass}>Chantier *</p>
          <div className="mt-1">
            <ProjectSelect
              projects={projects}
              value={form.projectId}
              onChange={(id) => onChange({ projectId: id })}
              allowEmpty
              placeholder="— Chantier —"
            />
          </div>
        </div>
        <div>
          <p className={labelClass}>Date *</p>
          <FrenchDateInput
            className={`${inputClass} mt-1`}
            value={form.bonDate}
            onChange={(bonDate) => onChange({ bonDate })}
          />
        </div>
        <div>
          <p className={labelClass}>Quantité (L) *</p>
          <input
            type="number"
            className={`${inputClass} mt-1`}
            value={form.litres}
            onChange={(e) =>
              onChange({ litres: e.target.value === "" ? "" : Number(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <p className={labelClass}>Prix unitaire (MAD/L)</p>
          <input
            type="number"
            min={0}
            step={0.01}
            className={`${inputClass} mt-1`}
            placeholder="Prix d'achat"
            value={form.unitPricePerLitre}
            onChange={(e) =>
              onChange({
                unitPricePerLitre:
                  e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
          <p className="mt-1 text-[10px] text-[var(--graphite)]/55">
            Enregistré sur le stock gasoil — utilisé pour l&apos;analyse consommation (MAD/h).
          </p>
        </div>
        <div>
          <p className={labelClass}>Compteur pompe</p>
          <input
            type="number"
            className={`${inputClass} mt-1`}
            value={form.pumpMeter}
            onChange={(e) => onChange({ pumpMeter: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Fournisseur</p>
          <div className="mt-1">
            <SupplierSelectWithAdd
              suppliers={suppliers}
              supplyType="gasoil"
              value={form.supplierId}
              onChange={(id, name) => onChange({ supplierId: id, supplier: name })}
              onSupplierAdded={onSupplierAdded}
              placeholder="— Fournisseur gasoil —"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Notes</p>
          <input
            className={`${inputClass} mt-1`}
            value={form.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>
      </div>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <AdminSheetField label="N° document" hint={`Format 001/${new Date().getFullYear()} — attribué à l'enregistrement`}>
          <input className={`${inputClass} font-mono bg-[var(--background)]`} readOnly value={form.bonNumber || "…"} />
        </AdminSheetField>
        {fields}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="border-b border-border pb-4 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Bon de commande gasoil</p>
        <p className="mt-1 text-xs text-[var(--graphite)]/70">
          Commande carburant — entrée stock automatique sur enregistrement.
        </p>
        <div className="mt-3">
          <p className={labelClass}>N° document</p>
          <input
            className={`${inputClass} mt-1 text-center font-mono bg-[var(--background)]`}
            readOnly
            value={form.bonNumber || "…"}
          />
          <p className="mt-1 text-[10px] text-[var(--graphite)]/55">
            Numéro attribué automatiquement ({new Date().getFullYear()}) — ex. 001/{new Date().getFullYear()}.
          </p>
        </div>
      </div>
      {fields}
    </div>
  );
}
