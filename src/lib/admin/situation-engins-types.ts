import type { AdminProject } from "@/components/admin/operations-types";
import type { DevisTemplate } from "@/components/admin/devis-types";
import type { SituationEnginsActivityRow } from "@/lib/admin/situation-engins-rows";

export type SituationEnginsLine = {
  matricule: string;
  designation: string;
  driverName: string;
  unitPriceHt: number;
  usageDays: number;
  totalHt: number;
};

/** Location journalière (bon par date). */
export type SituationEnginsLocationDetail = {
  date: string;
  matricule: string;
  designation: string;
  bonNo: string;
  usageDays: number;
  unitPriceHt: number;
  totalHt: number;
};

export type SituationEnginsGasoilLine = {
  date: string;
  number: string;
  matricule: string;
  equipmentName: string;
  litres: number;
  unitPrice: number;
  totalAmount: number;
  beneficiary: string;
};

export type SituationEnginsPartLine = {
  date: string;
  matricule: string;
  reference: string;
  designation: string;
  usageType: string;
  qty: number;
  unitPrice: number;
  totalHt: number;
};

export type SituationEnginsDeduction = {
  label: string;
  beneficiary: string;
  amountHt: number;
};

export type SituationEnginsPayment = {
  label: string;
  date: string;
  amount: number;
  paidTo: string;
  paidBy: string;
};

export type SituationEnginsBundle = {
  meta: {
    generatedAt: string;
    documentNumber: string;
    documentDate: string;
    periodLabel: string;
    from?: string;
    to?: string;
    project: AdminProject;
    template: DevisTemplate;
    locataire: string;
    loueur: string;
    driverName: string;
    driverCin: string;
    observation: string;
    materialId?: string;
    enginLabel?: string;
  };
  /** Récap mensuel par engin (totaux location). */
  lines: SituationEnginsLine[];
  /** Toutes écritures engin — location, gasoil, pièces (table unique). */
  activityRows: SituationEnginsActivityRow[];
  locationDetails: SituationEnginsLocationDetail[];
  gasoil: SituationEnginsGasoilLine[];
  parts: SituationEnginsPartLine[];
  totals: {
    situationHt: number;
    transportHt: number;
    deductionsHt: number;
    resteAPayerHt: number;
    gasoilLitres: number;
    gasoilCost: number;
    partsHt: number;
  };
  deductions: SituationEnginsDeduction[];
  payments: SituationEnginsPayment[];
};
