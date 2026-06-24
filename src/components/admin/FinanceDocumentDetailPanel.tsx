"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FinanceDocumentOriginCell } from "@/components/admin/FinanceDocumentOriginCell";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceDocumentDetail, FinanceDocumentPayment } from "@/lib/admin/finance-types";
import {
  FINANCE_DOCUMENT_TYPE_LABELS,
  FINANCE_PAYMENT_METHOD_LABELS,
  FINANCE_PAYMENT_STATUS_LABELS,
} from "@/lib/admin/finance-types";
import { formatFinancePaymentReference } from "@/lib/admin/finance-format";
import {
  btnPrimary,
  btnSecondary,
  ficheAmountClass,
  inputClass,
  inventoryPanelTitle,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { FinanceDocumentDetailSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { AdminBackLink } from "@/components/admin/ux/AdminBackLink";
import { financeFacturesHref } from "@/lib/admin/finance-nav";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

function fmtDate(d: string) {
  const x = d.slice(0, 10);
  if (!x) return "—";
  const [y, m, day] = x.split("-");
  return `${day}/${m}/${y}`;
}

export function FinanceDocumentDetailPanel({ documentId }: { documentId: string }) {
  const searchParams = useSearchParams();
  const toast = useAdminToast();
  const showError = toast.error;
  const { accounts, categories, projects, customers, suppliers, loading: coreLoading } = useFinanceCore();
  const [detail, setDetail] = useState<FinanceDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(
    () => searchParams.get("encaisser") === "1" || searchParams.get("payer") === "1",
  );
  const { sort, onSort, applySort } = useTableSort("movementDate");

  const payments = detail?.payments ?? [];

  const sortAccessors = useMemo(
    () => ({
      movementDate: (p: FinanceDocumentPayment) => p.movementDate,
      paymentMethod: (p: FinanceDocumentPayment) =>
        p.paymentMethod ? FINANCE_PAYMENT_METHOD_LABELS[p.paymentMethod] : "",
      reference: (p: FinanceDocumentPayment) => formatFinancePaymentReference(p),
      account: (p: FinanceDocumentPayment) => p.accountName ?? "",
      allocatedAmount: (p: FinanceDocumentPayment) => p.allocatedAmount,
      notes: (p: FinanceDocumentPayment) => p.notes || p.allocationNotes || "",
    }),
    [],
  );

  const sortedPayments = useMemo(
    () => applySort(payments, sortAccessors),
    [payments, sortAccessors, applySort],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/finance/documents/${encodeURIComponent(documentId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as FinanceDocumentDetail;
      setDetail(data);
      setDueDate(data.document.dueDate?.slice(0, 10) ?? "");
      setNotes(data.document.notes ?? "");
    } else {
      setDetail(null);
      showError(await readApiError(res));
    }
    setLoading(false);
  }, [documentId, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (
      (searchParams.get("encaisser") === "1" || searchParams.get("payer") === "1") &&
      detail &&
      detail.document.remainingAmount > 0
    ) {
      setShowPaymentForm(true);
    }
  }, [searchParams, detail]);

  async function saveMeta() {
    setSavingMeta(true);
    const res = await fetch(`/api/admin/finance/documents/${encodeURIComponent(documentId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: dueDate || null, notes }),
    });
    setSavingMeta(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Facture mise à jour.");
    await load();
  }

  if (loading || coreLoading) return <FinanceDocumentDetailSkeleton />;
  if (!detail) {
    return (
      <div className={moduleWrap}>
        <p className="text-sm text-[var(--graphite)]/70">Facture introuvable.</p>
        <AdminBackLink
          fallback={financeFacturesHref()}
          label="Retour aux factures"
          showIcon={false}
          className={`${btnSecondary} mt-4 inline-block`}
        />
      </div>
    );
  }

  const doc = detail.document;
  const isClient = doc.documentType === "client_invoice";
  const isVente = isClient;
  const partnerName = isClient ? doc.customerName : doc.supplierName;
  const facturesFallback = financeFacturesHref({ tab: isClient ? "clients" : "fournisseurs" });

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={`Facture ${doc.documentNumber || doc.id}`}
        description={`${FINANCE_DOCUMENT_TYPE_LABELS[doc.documentType]}${partnerName ? ` · ${partnerName}` : ""}`}
        actions={
          <AdminBackLink
            fallback={facturesFallback}
            label="Retour aux factures"
            showIcon={false}
            className={btnSecondary}
          />
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm shadow-black/[0.03] mb-4">
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <h3 className={inventoryPanelTitle}>Détails facture</h3>
        </div>
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Statut</p>
            <p className="font-medium text-[var(--navy)]">{FINANCE_PAYMENT_STATUS_LABELS[doc.paymentStatus]}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Montant TTC</p>
            <p className={ficheAmountClass}>{formatMoney(doc.amountTtc)} MAD</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Payé</p>
            <p className={ficheAmountClass}>{formatMoney(doc.paidAmount)} MAD</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Reste</p>
            <p className={ficheAmountClass}>{formatMoney(doc.remainingAmount)} MAD</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Date facture</p>
            <p className="text-sm">{fmtDate(doc.issueDate)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Chantier</p>
            <p className="text-sm">{doc.projectName ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Origine</p>
            <p className="text-sm">
              <FinanceDocumentOriginCell document={doc} />
            </p>
          </div>
        </div>

        <div className="border-t border-border px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
            <div>
              <p className={labelClass}>Échéance paiement</p>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Notes</p>
              <textarea
                className={`${inputClass} mt-1`}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className={`${btnSecondary} mt-3`}
            disabled={savingMeta}
            onClick={() => void saveMeta()}
          >
            {savingMeta ? "Enregistrement…" : "Enregistrer les détails"}
          </button>
        </div>
      </div>

      <AdminInventoryCard
        title={`Paiements enregistrés (${detail.payments.length})`}
        actions={
          doc.remainingAmount > 0 ? (
            <button type="button" className={btnPrimary} onClick={() => setShowPaymentForm((v) => !v)}>
              {showPaymentForm ? "Masquer le formulaire" : isVente ? "+ Encaissement" : "+ Paiement"}
            </button>
          ) : null
        }
      >
        {detail.payments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--graphite)]/70">
            Aucun paiement enregistré. Vous pouvez ajouter plusieurs paiements (ex. 2 chèques avec dates différentes).
          </p>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <AdminSortableTh label="Date" sortKey="movementDate" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Mode" sortKey="paymentMethod" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Référence" sortKey="reference" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Compte" sortKey="account" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Montant" sortKey="allocatedAmount" sort={sort} onSort={onSort} align="right" />
                <AdminSortableTh label="Notes" sortKey="notes" sort={sort} onSort={onSort} />
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((p) => (
                <tr key={p.allocationId} className={rowHover}>
                  <td className={tdClass}>{fmtDate(p.movementDate)}</td>
                  <td className={tdClass}>
                    {p.paymentMethod ? FINANCE_PAYMENT_METHOD_LABELS[p.paymentMethod] : "—"}
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={formatFinancePaymentReference(p)} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={p.accountName} lines={1} />
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{formatMoney(p.allocatedAmount)} MAD</td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={p.notes || p.allocationNotes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      {showPaymentForm && doc.remainingAmount > 0 ? (
        <div className="mt-4">
          <FinanceMovementForm
            accounts={accounts}
            categories={categories}
            defaultType={isVente ? "income" : "expense"}
            fixedMovementType={isVente ? "income" : "expense"}
            defaultCategorySlug={isVente ? "client_payment" : "supplier_payment"}
            hideTypeSelect
            lockProjectId={doc.projectId ?? undefined}
            lockFinanceDocumentId={doc.id}
            defaultAmount={doc.remainingAmount}
            documentAmountHt={doc.amountHt}
            documentAmountTtc={doc.amountTtc}
            referencePrefix={`PAY-${doc.documentNumber.replace(/[^\w-]+/g, "-")}`}
            fixedCustomerId={doc.customerId}
            fixedSupplierId={doc.supplierId}
            movementDateLabel="Date du paiement / chèque"
            referential={{ projects, customers, suppliers }}
            title={isVente ? "Nouvel encaissement" : "Nouveau paiement fournisseur"}
            onSaved={async () => {
              setShowPaymentForm(false);
              await load();
            }}
          />
        </div>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
