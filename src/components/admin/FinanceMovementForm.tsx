"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { FinanceAccountSelect } from "@/components/admin/FinanceAccountSelect";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { VatRateSelect } from "@/components/admin/VatRateSelect";
import { idNameOptions } from "@/components/admin/searchable-options";
import type { AdminProject } from "@/components/admin/operations-types";
import type {
  FinanceAccount,
  FinanceCategory,
  FinanceMovement,
  FinanceMovementType,
  FinancePaymentMethod,
} from "@/lib/admin/finance-types";
import { FINANCE_MOVEMENT_TYPE_LABELS, FINANCE_PAYMENT_METHOD_LABELS } from "@/lib/admin/finance-types";
import {
  financeAccountsForPaymentMethod,
  pickDefaultFinanceAccountId,
  suggestFinanceMovementReference,
  validateMovementInput,
} from "@/lib/admin/finance-rules";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import {
  DEFAULT_VAT_RATE,
  formatMoney,
  htToTtc,
  roundMoney,
  ttcToHt,
} from "@/lib/admin/price-ht-ttc";

function inferVatRate(amountHt: number, amountTtc: number) {
  if (amountHt <= 0) return DEFAULT_VAT_RATE;
  return roundMoney(((amountTtc / amountHt) - 1) * 100);
}

type Referential = {
  projects: AdminProject[];
  customers: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
};

export function FinanceMovementForm({
  accounts,
  categories,
  defaultAccountId,
  defaultType = "expense",
  referential,
  onSaved,
  title = "Nouveau mouvement",
  lockProjectId,
  fixedMovementType,
  defaultCategorySlug,
  hideTypeSelect = false,
  lockFinanceDocumentId,
  defaultAmount,
  documentAmountHt,
  documentAmountTtc,
  fixedCustomerId,
  fixedSupplierId,
  movementDateLabel = "Date",
  referencePrefix,
}: {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  defaultAccountId?: string;
  defaultType?: FinanceMovementType;
  referential: Referential;
  onSaved: () => void;
  title?: string;
  lockProjectId?: string;
  fixedMovementType?: FinanceMovementType;
  defaultCategorySlug?: string;
  hideTypeSelect?: boolean;
  lockFinanceDocumentId?: string;
  defaultAmount?: number;
  /** Facture liée — HT total (pour répartir le reste à payer). */
  documentAmountHt?: number;
  /** Facture liée — TTC total. */
  documentAmountTtc?: number;
  fixedCustomerId?: string | null;
  fixedSupplierId?: string | null;
  movementDateLabel?: string;
  referencePrefix?: string;
}) {
  const toast = useAdminToast();
  const [saving, setSaving] = useState(false);
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [movementType, setMovementType] = useState<FinanceMovementType>(fixedMovementType ?? defaultType);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [amountHt, setAmountHt] = useState(0);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>("cash");
  const [projectId, setProjectId] = useState(lockProjectId ?? "");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [virementRef, setVirementRef] = useState("");
  const [effectRef, setEffectRef] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  const amountTtc = useMemo(() => htToTtc(amountHt, vatRate), [amountHt, vatRate]);
  const vatAmount = useMemo(() => roundMoney(Math.max(0, amountTtc - amountHt)), [amountTtc, amountHt]);

  const accountsForPayment = useMemo(
    () => financeAccountsForPaymentMethod(accounts, paymentMethod),
    [accounts, paymentMethod],
  );

  useEffect(() => {
    if (defaultAccountId) setAccountId(defaultAccountId);
  }, [defaultAccountId]);

  useEffect(() => {
    if (accountId || accounts.length === 0) return;
    const picked = pickDefaultFinanceAccountId(accounts);
    if (picked) setAccountId(picked);
  }, [accounts, accountId]);

  useEffect(() => {
    if (referencePrefix) {
      setReference(suggestFinanceMovementReference(referencePrefix));
    }
  }, [referencePrefix, lockFinanceDocumentId]);

  useEffect(() => {
    if (lockProjectId) setProjectId(lockProjectId);
  }, [lockProjectId]);

  useEffect(() => {
    if (fixedMovementType) setMovementType(fixedMovementType);
  }, [fixedMovementType]);

  useEffect(() => {
    if (!defaultCategorySlug || categoryId) return;
    const match = categories.find((c) => c.slug === defaultCategorySlug);
    if (match) setCategoryId(match.id);
  }, [categories, defaultCategorySlug, categoryId]);

  useEffect(() => {
    if (defaultAmount == null || defaultAmount <= 0) return;
    if (documentAmountHt && documentAmountTtc && documentAmountTtc > 0) {
      setVatRate(inferVatRate(documentAmountHt, documentAmountTtc));
      setAmountHt(roundMoney(defaultAmount * (documentAmountHt / documentAmountTtc)));
      return;
    }
    setVatRate(DEFAULT_VAT_RATE);
    setAmountHt(ttcToHt(defaultAmount, DEFAULT_VAT_RATE));
  }, [defaultAmount, documentAmountHt, documentAmountTtc]);

  useEffect(() => {
    if (fixedCustomerId) setCustomerId(fixedCustomerId);
  }, [fixedCustomerId]);

  useEffect(() => {
    if (fixedSupplierId) setSupplierId(fixedSupplierId);
  }, [fixedSupplierId]);

  useEffect(() => {
    if (!accountId || accountsForPayment.some((a) => a.id === accountId)) return;
    const picked = pickDefaultFinanceAccountId(accountsForPayment);
    if (picked) setAccountId(picked);
  }, [accountsForPayment, accountId]);

  const filteredCategories = categories.filter((c) => {
    if (c.direction === "both") return true;
    if (movementType === "income" || movementType === "transfer_in") return c.direction === "income";
    if (movementType === "expense" || movementType === "transfer_out") return c.direction === "expense";
    return true;
  });

  const movementTypeOptions = useMemo(
    () =>
      Object.fromEntries(
        (["income", "expense"] as FinanceMovementType[]).map((t) => [t, FINANCE_MOVEMENT_TYPE_LABELS[t]]),
      ) as Record<string, string>,
    [],
  );

  const categoryOptions = useMemo(
    () => filteredCategories.map((c) => ({ value: c.id, label: c.name, keywords: c.name })),
    [filteredCategories],
  );

  const supplierOptions = useMemo(() => idNameOptions(referential.suppliers), [referential.suppliers]);

  async function submit() {
    const resolvedReference = reference.trim() || suggestFinanceMovementReference(referencePrefix ?? "MOV");
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
    const payload: Record<string, unknown> = {
        accountId,
        categoryId,
        movementType,
        amount: amountTtc,
        movementDate,
        reference: resolvedReference,
        paymentMethod,
        projectId: projectId || null,
        customerId: customerId || null,
        supplierId: supplierId || null,
        chequeNumber: chequeNumber || null,
        virementRef: virementRef || null,
        effectRef: effectRef || null,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        amountHt: amountHt > 0 ? amountHt : null,
        vatAmount: vatAmount > 0 ? vatAmount : null,
      };

    if (lockFinanceDocumentId && amountTtc > 0) {
      payload.allocateTo = {
        targetType: "finance_document",
        targetId: lockFinanceDocumentId,
        amount: amountTtc,
      };
    }

    const res = await fetch("/api/admin/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement enregistré.");
    setAmountHt(0);
    setReference("");
    setNotes("");
    onSaved();
  }

  return (
    <AdminFormCard
      title={title}
      footer={
        <div className="flex gap-2">
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      }
    >
      <div className={formGridClass}>
        <div>
          <p className={labelClass}>Compte</p>
          <div className="mt-1">
            <FinanceAccountSelect
              accounts={accountsForPayment}
              value={accountId}
              onChange={setAccountId}
              inputClassName={inputClass}
            />
          </div>
        </div>
        <div>
          <p className={labelClass}>Type</p>
          {hideTypeSelect || fixedMovementType ? (
            <p className={`${inputClass} mt-1 bg-[var(--background)]/80`}>
              {FINANCE_MOVEMENT_TYPE_LABELS[movementType]}
            </p>
          ) : (
            <div className="mt-1">
              <SearchableEnumSelect
                options={movementTypeOptions}
                value={movementType}
                onChange={(v) => setMovementType(v as FinanceMovementType)}
                inputClassName={inputClass}
                allowEmpty={false}
              />
            </div>
          )}
        </div>
        <div>
          <p className={labelClass}>Catégorie</p>
          <div className="mt-1">
            <SearchableSelect
              options={categoryOptions}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Sélectionner…"
              inputClassName={inputClass}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Montant</p>
          <div className="mt-1 grid gap-3 sm:grid-cols-[minmax(0,9rem)_1fr] sm:items-end">
            <VatRateSelect value={vatRate} onChange={setVatRate} compact label="TVA" />
            <HtTtcPriceFields vatRate={vatRate} valueHt={amountHt} onChangeHt={setAmountHt} />
          </div>
          {amountTtc > 0 ? (
            <p className="mt-2 text-sm text-[var(--graphite)]/75">
              Total mouvement :{" "}
              <strong className="text-[var(--navy)]">{formatMoney(amountTtc)} MAD TTC</strong>
              {vatAmount > 0 ? (
                <span className="text-[var(--graphite)]/60"> · TVA {formatMoney(vatAmount)}</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div>
          <p className={labelClass}>{movementDateLabel}</p>
          <input
            type="date"
            className={`${inputClass} mt-1`}
            value={movementDate}
            onChange={(e) => setMovementDate(e.target.value)}
          />
        </div>
        <div>
          <p className={labelClass}>Référence</p>
          <input className={`${inputClass} mt-1`} value={reference} onChange={(e) => setReference(e.target.value)} />
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
        {lockProjectId ? null : (
          <div className="sm:col-span-2">
            <p className={labelClass}>Chantier (optionnel)</p>
            <ProjectSelect
              projects={referential.projects}
              value={projectId}
              onChange={setProjectId}
              placeholder="Aucun chantier"
            />
          </div>
        )}
        <div>
          <p className={labelClass}>Client (optionnel)</p>
          {fixedCustomerId ? (
            <p className={`${inputClass} mt-1 bg-[var(--background)]/80`}>
              {referential.customers.find((c) => c.id === fixedCustomerId)?.name ?? "—"}
            </p>
          ) : (
            <div className="mt-1">
              <CustomerSelect
                customers={referential.customers}
                value={customerId}
                onChange={setCustomerId}
                inputClassName={inputClass}
              />
            </div>
          )}
        </div>
        <div>
          <p className={labelClass}>Fournisseur (optionnel)</p>
          {fixedSupplierId ? (
            <p className={`${inputClass} mt-1 bg-[var(--background)]/80`}>
              {referential.suppliers.find((s) => s.id === fixedSupplierId)?.name ?? "—"}
            </p>
          ) : (
            <div className="mt-1">
              <SearchableSelect
                options={supplierOptions}
                value={supplierId}
                onChange={setSupplierId}
                placeholder="—"
                inputClassName={inputClass}
              />
            </div>
          )}
        </div>
        {paymentMethod === "cheque" ? (
          <div>
            <p className={labelClass}>N° chèque</p>
            <input className={`${inputClass} mt-1`} value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
          </div>
        ) : null}
        {paymentMethod === "transfer" ? (
          <div>
            <p className={labelClass}>Réf. virement</p>
            <input className={`${inputClass} mt-1`} value={virementRef} onChange={(e) => setVirementRef(e.target.value)} />
          </div>
        ) : null}
        {paymentMethod === "effect" ? (
          <div>
            <p className={labelClass}>Réf. effet / traite</p>
            <input className={`${inputClass} mt-1`} value={effectRef} onChange={(e) => setEffectRef(e.target.value)} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <p className={labelClass}>Notes</p>
          <textarea className={`${inputClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}>Justificatif (URL)</p>
          <input className={`${inputClass} mt-1`} value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="Lien reçu / scan" />
        </div>
      </div>
    </AdminFormCard>
  );
}

export function FinanceJournalTable({
  movements,
  onVoid,
}: {
  movements: FinanceMovement[];
  onVoid?: (id: string) => void;
}) {
  const { sort, onSort, applySort } = useTableSort("movementDate");

  const sortAccessors = useMemo(
    () => ({
      movementDate: (m: FinanceMovement) => m.movementDate,
      reference: (m: FinanceMovement) => m.reference,
      movementType: (m: FinanceMovement) => FINANCE_MOVEMENT_TYPE_LABELS[m.movementType],
      category: (m: FinanceMovement) => m.categoryName ?? "",
      amount: (m: FinanceMovement) => m.amount,
      project: (m: FinanceMovement) => m.projectName ?? "",
    }),
    [],
  );

  const sortedMovements = useMemo(
    () => applySort(movements, sortAccessors),
    [movements, sortAccessors, applySort],
  );

  return (
    <AdminTableWrap>
      <thead>
        <tr>
          <AdminSortableTh label="Date" sortKey="movementDate" sort={sort} onSort={onSort} />
          <AdminSortableTh label="Réf." sortKey="reference" sort={sort} onSort={onSort} />
          <AdminSortableTh label="Type" sortKey="movementType" sort={sort} onSort={onSort} />
          <AdminSortableTh label="Catégorie" sortKey="category" sort={sort} onSort={onSort} />
          <AdminSortableTh label="Montant" sortKey="amount" sort={sort} onSort={onSort} align="right" />
          <AdminSortableTh label="Chantier" sortKey="project" sort={sort} onSort={onSort} />
          <th className={thClass} />
        </tr>
      </thead>
      <tbody>
        {sortedMovements.map((m) => (
          <tr key={m.id} className={rowHover}>
            <td className={tdClass}>{m.movementDate}</td>
            <td className={tdClass}>{m.reference}</td>
            <td className={tdClass}>{FINANCE_MOVEMENT_TYPE_LABELS[m.movementType]}</td>
            <td className={tdClass}>{m.categoryName ?? "—"}</td>
            <td className={tdClass}>{m.amount.toLocaleString("fr-MA")} MAD</td>
            <td className={tdClass}>{m.projectName ?? "—"}</td>
            <td className={tdClass}>
              {onVoid && !m.voidedAt ? (
                <button type="button" className={btnSecondary} onClick={() => onVoid(m.id)}>
                  Annuler
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </AdminTableWrap>
  );
}
