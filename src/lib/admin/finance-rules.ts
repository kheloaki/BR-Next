import type {
  FinanceCategoryDirection,
  FinanceMovementType,
  FinancePaymentMethod,
} from "@/lib/admin/finance-types";

/** Gestion opérations ≠ gestion finance — invariants enforced at API layer. */

export const FINANCE_MOVEMENT_TYPES: FinanceMovementType[] = [
  "income",
  "expense",
  "transfer_in",
  "transfer_out",
  "adjustment",
];

export const FINANCE_PAYMENT_METHODS: FinancePaymentMethod[] = [
  "cash",
  "bank",
  "cheque",
  "transfer",
  "effect",
];

export const FINANCE_CATEGORY_DIRECTIONS: FinanceCategoryDirection[] = ["income", "expense", "both"];

/** Encaissements / décaissements reports exclude internal transfers. */
export const FINANCE_CASHFLOW_TYPES: FinanceMovementType[] = ["income", "expense", "adjustment"];

export const FINANCE_TRANSFER_TYPES: FinanceMovementType[] = ["transfer_in", "transfer_out"];

export function movementTypeForDirection(
  direction: "in" | "out",
  isTransfer: boolean,
): FinanceMovementType {
  if (isTransfer) return direction === "in" ? "transfer_in" : "transfer_out";
  return direction === "in" ? "income" : "expense";
}

export function isValidMovementTypeForCategory(
  movementType: FinanceMovementType,
  categoryDirection: FinanceCategoryDirection,
): boolean {
  if (categoryDirection === "both") return true;
  if (FINANCE_TRANSFER_TYPES.includes(movementType)) return true;
  if (movementType === "adjustment") return true;
  if (categoryDirection === "income") {
    return movementType === "income" || movementType === "transfer_in";
  }
  return movementType === "expense" || movementType === "transfer_out";
}

export function signedMovementAmount(type: FinanceMovementType, amount: number): number {
  const abs = Math.abs(amount);
  switch (type) {
    case "income":
    case "transfer_in":
      return abs;
    case "expense":
    case "transfer_out":
      return -abs;
    case "adjustment":
      return amount;
    default:
      return amount;
  }
}

export function validateMovementInput(input: {
  movementDate?: string;
  amount?: number;
  accountId?: string;
  categoryId?: string;
  reference?: string;
}): string | null {
  if (!input.movementDate?.trim()) return "Date requise.";
  if (!input.accountId?.trim()) return "Compte requis.";
  if (!input.categoryId?.trim()) return "Catégorie requise.";
  if (!input.reference?.trim()) return "Référence requise.";
  if (typeof input.amount !== "number" || input.amount <= 0) return "Montant invalide.";
  return null;
}

export const FINANCE_SYSTEM_CATEGORIES = [
  { slug: "client_payment", name: "Encaissement client", direction: "income" as const },
  { slug: "supplier_payment", name: "Paiement fournisseur", direction: "expense" as const },
  { slug: "gasoil", name: "Gasoil", direction: "expense" as const },
  { slug: "achat_pieces", name: "Achat pièces", direction: "expense" as const },
  { slug: "location_materiel", name: "Location matériel", direction: "expense" as const },
  { slug: "salaire", name: "Salaire", direction: "expense" as const },
  { slug: "transport", name: "Transport", direction: "expense" as const },
  { slug: "avance", name: "Avance", direction: "both" as const },
  { slug: "bank_fee", name: "Frais bancaires", direction: "expense" as const },
  { slug: "maintenance", name: "Maintenance", direction: "expense" as const },
  { slug: "sous_traitance", name: "Sous-traitance", direction: "expense" as const },
  { slug: "frais_chantier", name: "Frais chantier", direction: "expense" as const },
  { slug: "administration", name: "Administration", direction: "expense" as const },
  { slug: "taxes", name: "Taxes", direction: "expense" as const },
  { slug: "divers", name: "Divers", direction: "both" as const },
] as const;
