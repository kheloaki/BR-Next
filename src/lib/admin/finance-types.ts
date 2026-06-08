export type FinanceAccountType = "cash" | "bank";

export type FinanceMovementType =
  | "income"
  | "expense"
  | "transfer_in"
  | "transfer_out"
  | "adjustment";

export type FinancePaymentMethod = "cash" | "bank" | "cheque" | "transfer" | "effect";

export type FinanceCategoryDirection = "income" | "expense" | "both";

export type FinanceDocumentType =
  | "client_invoice"
  | "supplier_invoice"
  | "client_credit"
  | "supplier_credit";

export type FinancePaymentStatus = "unpaid" | "partial" | "paid" | "overdue";

export type FinanceAllocationTargetType =
  | "quote"
  | "traitement"
  | "purchase_request"
  | "finance_document"
  | "expense"
  | "manual";

export type FinanceAccount = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  accountType: FinanceAccountType;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  isDefault: boolean;
  bankName: string | null;
  rib: string | null;
  iban: string | null;
  balance?: number;
  createdAt: string;
};

export type FinanceCategory = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  direction: FinanceCategoryDirection;
  isSystem: boolean;
  parentId: string | null;
};

export type FinanceMovement = {
  id: string;
  organizationId: string;
  accountId: string;
  accountName?: string;
  categoryId: string;
  categoryName?: string;
  movementType: FinanceMovementType;
  amount: number;
  movementDate: string;
  reference: string;
  paymentMethod: FinancePaymentMethod | null;
  projectId: string | null;
  projectName?: string | null;
  customerId: string | null;
  customerName?: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  chequeNumber: string | null;
  virementRef: string | null;
  effectRef: string | null;
  transferGroupId: string | null;
  createdBy: string;
  notes: string | null;
  receiptUrl: string | null;
  amountHt: number | null;
  vatAmount: number | null;
  isReconciled: boolean;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  createdAt: string;
};

export type FinanceDocument = {
  id: string;
  organizationId: string;
  documentType: FinanceDocumentType;
  documentNumber: string;
  sourceType: string | null;
  sourceId: string | null;
  customerId: string | null;
  customerName?: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  projectId: string | null;
  projectName?: string | null;
  issueDate: string;
  dueDate: string | null;
  amountHt: number;
  amountTtc: number;
  currency: string;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: FinancePaymentStatus;
  notes: string | null;
  createdAt: string;
};

export type FinanceAllocation = {
  id: string;
  organizationId: string;
  movementId: string;
  targetType: FinanceAllocationTargetType;
  targetId: string;
  allocatedAmount: number;
  allocatedAt: string;
  notes: string | null;
};

export type FinanceCaisseClosing = {
  id: string;
  organizationId: string;
  accountId: string;
  accountName?: string;
  closingDate: string;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  theoreticalBalance: number;
  countedBalance: number;
  difference: number;
  closedBy: string;
  signedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type FinanceMovementInput = {
  accountId: string;
  categoryId: string;
  movementType: FinanceMovementType;
  amount: number;
  movementDate: string;
  reference: string;
  paymentMethod?: FinancePaymentMethod | null;
  projectId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  chequeNumber?: string | null;
  virementRef?: string | null;
  effectRef?: string | null;
  notes?: string | null;
  receiptUrl?: string | null;
  amountHt?: number | null;
  vatAmount?: number | null;
};

export type FinanceTransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  movementDate: string;
  reference: string;
  notes?: string | null;
};

export const FINANCE_MOVEMENT_TYPE_LABELS: Record<FinanceMovementType, string> = {
  income: "Entrée",
  expense: "Sortie",
  transfer_in: "Transfert entrant",
  transfer_out: "Transfert sortant",
  adjustment: "Ajustement",
};

export const FINANCE_PAYMENT_STATUS_LABELS: Record<FinancePaymentStatus, string> = {
  unpaid: "Impayé",
  partial: "Partiel",
  paid: "Payé",
  overdue: "En retard",
};

export const FINANCE_DOCUMENT_TYPE_LABELS: Record<FinanceDocumentType, string> = {
  client_invoice: "Facture client",
  supplier_invoice: "Facture fournisseur",
  client_credit: "Avoir client",
  supplier_credit: "Avoir fournisseur",
};
