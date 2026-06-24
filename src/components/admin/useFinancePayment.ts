"use client";

import type {
  FinanceAccount,
  FinanceCategory,
  FinancePaymentMethod,
} from "@/lib/admin/finance-types";
import {
  pickDefaultFinanceAccountId,
  suggestFinanceMovementReference,
  validateMovementInput,
} from "@/lib/admin/finance-rules";
import { readApiError } from "@/components/admin/ux/useAdminToast";

export type RecordFinancePaymentInput = {
  accountId: string;
  categoryId: string;
  amount: number;
  movementDate: string;
  reference: string;
  paymentMethod?: FinancePaymentMethod;
  projectId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  chequeNumber?: string | null;
  virementRef?: string | null;
  effectRef?: string | null;
  notes?: string | null;
  financeDocumentId?: string | null;
  movementType: "income" | "expense";
};

export async function recordFinancePayment(
  input: RecordFinancePaymentInput,
  options?: { accounts?: FinanceAccount[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reference =
    input.reference.trim() || suggestFinanceMovementReference(input.financeDocumentId ? "PAY" : "MOV");
  const accountId =
    input.accountId.trim() ||
    (options?.accounts?.length ? pickDefaultFinanceAccountId(options.accounts) : "");

  const validationError = validateMovementInput({
    movementDate: input.movementDate,
    amount: input.amount,
    accountId,
    categoryId: input.categoryId,
    reference,
  });
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const body: Record<string, unknown> = {
    accountId,
    categoryId: input.categoryId,
    movementType: input.movementType,
    amount: input.amount,
    movementDate: input.movementDate,
    reference,
    paymentMethod: input.paymentMethod ?? "cash",
    projectId: input.projectId ?? null,
    customerId: input.customerId ?? null,
    supplierId: input.supplierId ?? null,
    chequeNumber: input.chequeNumber ?? null,
    virementRef: input.virementRef ?? null,
    effectRef: input.effectRef ?? null,
    notes: input.notes ?? null,
  };

  if (input.financeDocumentId && input.amount > 0) {
    body.allocateTo = {
      targetType: "finance_document",
      targetId: input.financeDocumentId,
      amount: input.amount,
    };
  }

  const res = await fetch("/api/admin/finance/movements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, error: await readApiError(res) };
  }
  return { ok: true };
}

export function resolveCategoryId(
  categories: FinanceCategory[],
  slug: string,
): FinanceCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function defaultCashAccount(accounts: FinanceAccount[]): FinanceAccount | undefined {
  return accounts.find((a) => a.accountType === "cash" && a.isDefault) ?? accounts.find((a) => a.accountType === "cash");
}
