"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FinanceAccountSelect } from "@/components/admin/FinanceAccountSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { FinanceCategorySelectWithAdd } from "@/components/admin/FinanceCategorySelectWithAdd";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { SupplierSelectWithAdd } from "@/components/admin/SupplierSelectWithAdd";
import { VatRateSelect } from "@/components/admin/VatRateSelect";
import type { Supplier } from "@/components/admin/devis-types";
import type { AdminProject } from "@/components/admin/operations-types";
import type { FinanceAccount, FinanceCategory, FinancePaymentMethod } from "@/lib/admin/finance-types";
import { FINANCE_PAYMENT_METHOD_LABELS } from "@/lib/admin/finance-types";
import {
  pickDefaultFinanceAccountId,
  suggestFinanceMovementReference,
  validateMovementInput,
} from "@/lib/admin/finance-rules";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc, roundMoney } from "@/lib/admin/price-ht-ttc";
import { btnPrimary, formGridClass, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

function FormSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border/70 bg-[var(--background)]/35 p-4 ${className}`}>
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--graphite)]/65">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function FinanceExpenseForm({
  accounts,
  categories,
  projects,
  suppliers,
  onSaved,
  onSupplierAdded,
  onCategoryAdded,
}: {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  projects: AdminProject[];
  suppliers: Supplier[];
  onSaved: () => void;
  onSupplierAdded?: (supplier: Supplier) => void;
  onCategoryAdded?: (category: FinanceCategory) => void;
}) {
  const toast = useAdminToast();
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountHt, setAmountHt] = useState(0);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState(() => suggestFinanceMovementReference("DEP"));
  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>("cash");
  const [projectId, setProjectId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [virementRef, setVirementRef] = useState("");
  const [effectRef, setEffectRef] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const amountTtc = useMemo(() => htToTtc(amountHt, vatRate), [amountHt, vatRate]);
  const vatAmount = useMemo(() => roundMoney(Math.max(0, amountTtc - amountHt)), [amountTtc, amountHt]);

  useEffect(() => {
    if (accountId || accounts.length === 0) return;
    const picked = pickDefaultFinanceAccountId(accounts);
    if (picked) setAccountId(picked);
  }, [accounts, accountId]);

  async function submit() {
    const resolvedReference = reference.trim() || suggestFinanceMovementReference("DEP");
    const validationError = validateMovementInput({
      movementDate,
      amount: amountTtc,
      accountId,
      categoryId,
      reference: resolvedReference,
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        categoryId,
        movementType: "expense",
        amount: amountTtc,
        movementDate,
        reference: resolvedReference,
        paymentMethod,
        projectId: projectId || null,
        supplierId: supplierId || null,
        chequeNumber: chequeNumber || null,
        virementRef: virementRef || null,
        effectRef: effectRef || null,
        notes: notes.trim() || null,
        receiptUrl: receiptUrl.trim() || null,
        amountHt: amountHt > 0 ? amountHt : null,
        vatAmount: vatAmount > 0 ? vatAmount : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Dépense enregistrée.");
    setAmountHt(0);
    setNotes("");
    setReceiptUrl("");
    setReference(suggestFinanceMovementReference("DEP"));
    onSaved();
  }

  return (
    <AdminFormCard
      title="Nouvelle dépense"
      hint="Sortie — saisie HT/TTC, affectation fournisseur et catégorie."
      footer={
        <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
          {saving ? "Enregistrement…" : "Enregistrer la dépense"}
        </button>
      }
    >
      <div className="space-y-4">
        <FormSection title="Montant">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-end">
            <VatRateSelect value={vatRate} onChange={setVatRate} compact />
            <HtTtcPriceFields vatRate={vatRate} valueHt={amountHt} onChangeHt={setAmountHt} />
          </div>
          {amountTtc > 0 ? (
            <p className="mt-3 text-sm text-[var(--graphite)]/75">
              Total sortie : <strong className="text-[var(--navy)]">{formatMoney(amountTtc)} MAD TTC</strong>
              {vatAmount > 0 ? (
                <span className="text-[var(--graphite)]/60"> · TVA {formatMoney(vatAmount)}</span>
              ) : null}
            </p>
          ) : null}
        </FormSection>

        <FormSection title="Paiement">
          <div className={formGridClass}>
            <div>
              <p className={labelClass}>Compte</p>
              <div className="mt-1">
                <FinanceAccountSelect
                  accounts={accounts}
                  value={accountId}
                  onChange={setAccountId}
                  inputClassName={inputClass}
                />
              </div>
            </div>
            <div>
              <p className={labelClass}>Date</p>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Mode de paiement</p>
              <div className="mt-1">
                <SearchableEnumSelect
                  options={FINANCE_PAYMENT_METHOD_LABELS}
                  value={paymentMethod}
                  onChange={(v) => setPaymentMethod(v as FinancePaymentMethod)}
                  inputClassName={inputClass}
                  allowEmpty={false}
                />
              </div>
            </div>
            <div>
              <p className={labelClass}>Référence</p>
              <input className={`${inputClass} mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            {paymentMethod === "cheque" ? (
              <div className="sm:col-span-2">
                <p className={labelClass}>N° chèque</p>
                <input className={`${inputClass} mt-1`} value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
              </div>
            ) : null}
            {paymentMethod === "transfer" ? (
              <div className="sm:col-span-2">
                <p className={labelClass}>Réf. virement</p>
                <input className={`${inputClass} mt-1`} value={virementRef} onChange={(e) => setVirementRef(e.target.value)} />
              </div>
            ) : null}
            {paymentMethod === "effect" ? (
              <div className="sm:col-span-2">
                <p className={labelClass}>Réf. effet / traite</p>
                <input className={`${inputClass} mt-1`} value={effectRef} onChange={(e) => setEffectRef(e.target.value)} />
              </div>
            ) : null}
          </div>
        </FormSection>

        <FormSection title="Affectation">
          <div className={formGridClass}>
            <FinanceCategorySelectWithAdd
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              onCategoryAdded={onCategoryAdded}
              direction="expense"
            />
            <div>
              <p className={labelClass}>Fournisseur</p>
              <div className="mt-1">
                <SupplierSelectWithAdd
                  suppliers={suppliers}
                  value={supplierId}
                  onChange={(id) => setSupplierId(id)}
                  onSupplierAdded={onSupplierAdded}
                  placeholder="— Fournisseur —"
                />
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <p className={labelClass}>Chantier (optionnel)</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} placeholder="Aucun chantier" />
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Compléments">
          <div className="space-y-3">
            <div>
              <p className={labelClass}>Notes</p>
              <textarea className={`${inputClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Justificatif (URL)</p>
              <input
                className={`${inputClass} mt-1`}
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="Lien reçu / scan"
              />
            </div>
          </div>
        </FormSection>
      </div>
    </AdminFormCard>
  );
}
