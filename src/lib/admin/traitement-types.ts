export type TraitementType = "achat" | "vente";

export type TraitementStatus = "open" | "in_progress" | "completed" | "cancelled";

export type TraitementStepKey = "bc" | "devis" | "bl" | "f" | "br";

export type TraitementStepStatus = "pending" | "done" | "na";

export type TraitementStep = {
  status: TraitementStepStatus;
  docNumber: string;
  docDate: string;
  quoteId?: string;
  /** Bon gasoil id when BL step is a fuel reception */
  gasoilBonId?: string;
};

export type TraitementSupplyKind = "articles" | "gasoil";

export type TraitementSteps = Partial<Record<TraitementStepKey, TraitementStep>>;

export interface TraitementLine {
  id: string;
  productId: string | null;
  stockItemId: string | null;
  reference: string;
  designation: string;
  unit: string;
  qty: number;
  unitPrice: number;
  sortOrder: number;
}

export interface Traitement {
  id: string;
  traitementType: TraitementType;
  supplyKind: TraitementSupplyKind;
  number: string;
  label: string;
  projectId: string | null;
  supplierId: string | null;
  customerId: string | null;
  partnerName: string;
  status: TraitementStatus;
  notes: string;
  steps: TraitementSteps;
  lines: TraitementLine[];
  purchaseRequestId: string | null;
  sourceTraitementId: string | null;
  venteTraitementId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TraitementLineInput = {
  id?: string;
  productId?: string;
  stockItemId?: string;
  reference?: string;
  designation: string;
  unit?: string;
  qty: number;
  unitPrice?: number;
};

export const TRAITEMENT_STATUS_LABELS: Record<TraitementStatus, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

export const TRAITEMENT_STEP_LABELS: Record<TraitementStepKey, string> = {
  bc: "BC",
  devis: "Devis",
  bl: "BL",
  f: "F",
  br: "BR",
};

export const TRAITEMENT_STEP_STATUS_LABELS: Record<TraitementStepStatus, string> = {
  pending: "En attente",
  done: "Fait",
  na: "N/A",
};

export const TRAITEMENT_STEPS_BY_TYPE: Record<TraitementType, TraitementStepKey[]> = {
  achat: ["bc", "bl", "f", "br"],
  vente: ["devis", "bl", "f", "br"],
};

export function defaultTraitementSteps(type: TraitementType): TraitementSteps {
  const keys = TRAITEMENT_STEPS_BY_TYPE[type];
  const steps: TraitementSteps = {};
  for (const key of keys) {
    steps[key] = { status: key === "br" ? "na" : "pending", docNumber: "", docDate: "" };
  }
  return steps;
}

export function emptyTraitementStep(): TraitementStep {
  return { status: "pending", docNumber: "", docDate: "" };
}

export function normalizeTraitementSteps(
  type: TraitementType,
  raw: TraitementSteps | null | undefined,
): TraitementSteps {
  const base = defaultTraitementSteps(type);
  if (!raw || typeof raw !== "object") return base;
  for (const key of TRAITEMENT_STEPS_BY_TYPE[type]) {
    const step = raw[key];
    if (!step) continue;
    base[key] = {
      status:
        step.status === "done" || step.status === "na" || step.status === "pending"
          ? step.status
          : "pending",
      docNumber: step.docNumber?.trim() || "",
      docDate: step.docDate?.trim() || "",
      quoteId: step.quoteId?.trim() || undefined,
      gasoilBonId: step.gasoilBonId?.trim() || undefined,
    };
  }
  return base;
}

export function traitementLineTotal(lines: TraitementLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0);
}
