"use client";

import type {
  AdminProject,
  GasoilBonType,
  GasoilContact,
  GasoilVehicleCategory,
  RentalMaterial,
} from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import { btnPrimary, btnSecondary } from "@/components/admin/admin-form-styles";
import { FuelGasoilBonCommandeForm } from "@/components/admin/FuelGasoilBonCommandeForm";
import { FuelGasoilBonSortieForm } from "@/components/admin/FuelGasoilBonSortieForm";
import { GASOIL_BON_TYPE_LABELS, GASOIL_BON_TYPES } from "@/lib/admin/gasoil-bon";
import type { GasoilUnitPriceInfo } from "@/lib/admin/gasoil-unit-price";

export type GasoilBonFormState = {
  bonNumber: string;
  bonType: GasoilBonType;
  vehicleCategory: GasoilVehicleCategory;
  projectId: string;
  materialId: string;
  vehicleLabel: string;
  bonDate: string;
  pumpMeter: string;
  fuelTime: string;
  litres: number | "";
  driverContactId: string;
  driverName: string;
  pompisteContactId: string;
  pumpAttendant: string;
  supervisor: string;
  supplier: string;
  supplierId: string;
  deliveryNote: string;
  notes: string;
  syncStock: boolean;
  unitPricePerLitre: number | "";
};

export const EMPTY_GASOIL_BON_FORM: GasoilBonFormState = {
  bonNumber: "",
  bonType: "sortie",
  vehicleCategory: "engin",
  projectId: "",
  materialId: "",
  vehicleLabel: "",
  bonDate: new Date().toISOString().slice(0, 10),
  pumpMeter: "",
  fuelTime: "",
  litres: "",
  driverContactId: "",
  driverName: "",
  pompisteContactId: "",
  pumpAttendant: "",
  supervisor: "",
  supplier: "",
  supplierId: "",
  deliveryNote: "",
  notes: "",
  syncStock: true,
  unitPricePerLitre: "",
};

type Props = {
  form: GasoilBonFormState;
  onChange: (patch: Partial<GasoilBonFormState>) => void;
  projects: AdminProject[];
  materials: RentalMaterial[];
  gasoilContacts: GasoilContact[];
  onGasoilContactAdded: (contact: GasoilContact) => void;
  suppliers?: Supplier[];
  onSupplierAdded?: (supplier: Supplier) => void;
  /** When set, hides the type toggle and locks the form to one bon type. */
  fixedBonType?: GasoilBonType;
  /** Lock document number (edit mode). */
  lockBonNumber?: boolean;
  /** Moyenne prix achats stock — préremplissage bon de sortie. */
  avgUnitPriceInfo?: GasoilUnitPriceInfo | null;
};

export function validateGasoilBonForm(form: GasoilBonFormState): string | null {
  if (!form.projectId) return "Sélectionnez un chantier.";
  const L = typeof form.litres === "number" ? form.litres : Number(form.litres);
  if (!L || L <= 0) return "Indiquez la quantité en litres.";
  if (form.bonType === "achat") return null;
  if (!form.materialId && !form.vehicleLabel.trim()) {
    return "Sélectionnez un matériel ou saisissez le matricule.";
  }
  return null;
}

/** Responsable (sortie) — stocké dans notes si présent. */
export function gasoilBonNotesFromForm(form: GasoilBonFormState): string {
  if (form.bonType === "achat") return form.notes.trim();
  if (!form.supervisor.trim()) return "";
  return `Responsable: ${form.supervisor.trim()}`;
}

export function gasoilBonRowToForm(row: {
  number: string;
  bonType: GasoilBonType;
  vehicleCategory: GasoilVehicleCategory;
  projectId: string | null;
  materialId: string | null;
  vehicleLabel: string;
  bonDate: string;
  litres: number;
  pumpMeter: number | null;
  supplier: string;
  beneficiary: string;
  driverContactId?: string | null;
  pompisteContactId?: string | null;
  fuelTime: string;
  deliveryNote: string;
  notes: string;
  unitPrice?: number;
}): GasoilBonFormState {
  const supervisorMatch = row.notes.match(/^Responsable:\s*(.+)$/);
  return {
    bonNumber: row.number,
    bonType: row.bonType,
    vehicleCategory: row.vehicleCategory,
    projectId: row.projectId ?? "",
    materialId: row.materialId ?? "",
    vehicleLabel: row.vehicleLabel,
    bonDate: row.bonDate,
    pumpMeter: row.pumpMeter != null ? String(row.pumpMeter) : "",
    fuelTime: row.fuelTime,
    litres: row.litres,
    driverContactId: row.driverContactId ?? "",
    driverName: row.beneficiary,
    pompisteContactId: row.pompisteContactId ?? "",
    pumpAttendant: row.supplier,
    supervisor: supervisorMatch?.[1]?.trim() ?? "",
    supplier: row.supplier,
    supplierId: "",
    deliveryNote: row.deliveryNote,
    notes: row.bonType === "achat" ? row.notes : "",
    syncStock: true,
    unitPricePerLitre: row.unitPrice && row.unitPrice > 0 ? row.unitPrice : "",
  };
}

export function FuelGasoilBonForm({
  form,
  onChange,
  projects,
  materials,
  gasoilContacts,
  onGasoilContactAdded,
  suppliers = [],
  onSupplierAdded,
  fixedBonType,
  lockBonNumber,
  avgUnitPriceInfo,
}: Props) {
  const bonType = fixedBonType ?? form.bonType;

  function setBonType(bonType: GasoilBonType) {
    onChange({
      bonType,
      materialId: "",
      vehicleLabel: "",
      driverContactId: "",
      driverName: "",
      pompisteContactId: "",
      pumpAttendant: "",
      supervisor: "",
      fuelTime: "",
      supplier: "",
      supplierId: "",
      deliveryNote: "",
      notes: "",
    });
  }

  return (
    <div className="space-y-4">
      {!fixedBonType ? (
        <div className="flex flex-wrap justify-center gap-2">
          {GASOIL_BON_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={form.bonType === t ? btnPrimary : `${btnSecondary} border border-border`}
              onClick={() => setBonType(t)}
            >
              {GASOIL_BON_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      ) : null}

      {bonType === "achat" ? (
        <FuelGasoilBonCommandeForm
          form={form}
          onChange={onChange}
          projects={projects}
          suppliers={suppliers}
          onSupplierAdded={onSupplierAdded ?? (() => {})}
          lockBonNumber={lockBonNumber}
        />
      ) : (
        <FuelGasoilBonSortieForm
          form={form}
          onChange={onChange}
          projects={projects}
          materials={materials}
          gasoilContacts={gasoilContacts}
          onGasoilContactAdded={onGasoilContactAdded}
          lockBonNumber={lockBonNumber}
          avgUnitPriceInfo={avgUnitPriceInfo}
        />
      )}
    </div>
  );
}
