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
import { GASOIL_BON_TYPE_LABELS, GASOIL_BON_TYPES, DEFAULT_GASOIL_SUPERVISOR } from "@/lib/admin/gasoil-bon";
import {
  emptyGasoilBonLine,
  flattenGasoilBonLines,
  linesFromGasoilBon,
  sumGasoilBonLineLitres,
  type GasoilBonLineForm,
} from "@/lib/admin/gasoil-bon-lines";
import type { GasoilUnitPriceInfo } from "@/lib/admin/gasoil-unit-price";

export type { GasoilBonLineForm };

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
  /** Lignes du tableau (sortie). */
  lines: GasoilBonLineForm[];
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
  lines: [emptyGasoilBonLine()],
  driverContactId: "",
  driverName: "",
  pompisteContactId: "",
  pumpAttendant: "",
  supervisor: DEFAULT_GASOIL_SUPERVISOR,
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
  if (form.bonType === "achat") {
    const L = typeof form.litres === "number" ? form.litres : Number(form.litres);
    if (!L || L <= 0) return "Indiquez la quantité en litres.";
    return null;
  }

  const workingLines =
    form.lines.length > 0
      ? form.lines
      : [
          emptyGasoilBonLine({
            bonDate: form.bonDate,
            materialId: form.materialId,
            vehicleLabel: form.vehicleLabel,
            pumpMeter: form.pumpMeter,
            fuelTime: form.fuelTime,
            litres: form.litres,
          }),
        ];
  const flat = flattenGasoilBonLines(workingLines);
  if (!flat) return "Ajoutez au moins une ligne avec des litres.";
  if (!flat.materialId && !flat.vehicleLabel.trim()) {
    return "Sélectionnez un matériel ou saisissez le matricule sur une ligne.";
  }
  for (let i = 0; i < workingLines.length; i++) {
    const line = workingLines[i];
    const L = typeof line.litres === "number" ? line.litres : Number(line.litres);
    if (L > 0 && !line.materialId && !line.vehicleLabel.trim()) {
      return `Ligne ${i + 1} : sélectionnez un matériel ou saisissez le matricule.`;
    }
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
  lineItems?: import("@/components/admin/operations-types").GasoilBonLineItem[];
}): GasoilBonFormState {
  const supervisorMatch = row.notes.match(/^Responsable:\s*(.+)$/);
  const lines = linesFromGasoilBon(row);
  const litresTotal = sumGasoilBonLineLitres(lines);
  const primary = lines[0] ?? emptyGasoilBonLine();
  return {
    bonNumber: row.number,
    bonType: row.bonType,
    vehicleCategory: row.vehicleCategory,
    projectId: row.projectId ?? "",
    materialId: primary.materialId || row.materialId || "",
    vehicleLabel: primary.vehicleLabel || row.vehicleLabel,
    bonDate: primary.bonDate || row.bonDate,
    pumpMeter: primary.pumpMeter,
    fuelTime: primary.fuelTime || row.fuelTime,
    litres: litresTotal || row.litres,
    lines,
    driverContactId: row.driverContactId ?? "",
    driverName: row.beneficiary,
    pompisteContactId: row.pompisteContactId ?? "",
    pumpAttendant: row.supplier,
    supervisor: supervisorMatch?.[1]?.trim() || DEFAULT_GASOIL_SUPERVISOR,
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

  function setBonType(next: GasoilBonType) {
    onChange({
      bonType: next,
      materialId: "",
      vehicleLabel: "",
      driverContactId: "",
      driverName: "",
      pompisteContactId: "",
      pumpAttendant: "",
      supervisor: next === "sortie" ? DEFAULT_GASOIL_SUPERVISOR : "",
      fuelTime: "",
      supplier: "",
      supplierId: "",
      deliveryNote: "",
      notes: "",
      lines: [emptyGasoilBonLine()],
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
