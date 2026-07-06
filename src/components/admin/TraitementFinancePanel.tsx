"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import type { Traitement } from "@/lib/admin/traitement-types";
import type { TraitementFinanceSummary } from "@/lib/admin/traitement-finance-sync";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  ficheAmountClass,
  inventoryPanelTitle,
  panel,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";
import { TraitementFinancePanelSkeleton } from "@/components/admin/skeletons/pages";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

import { financeFactureDetailHref } from "@/lib/admin/finance-nav";

export function TraitementFinancePanel({
  traitement,
  requestPaymentOpen,
  onPaymentOpenHandled,
}: {
  traitement: Traitement;
  requestPaymentOpen?: boolean;
  onPaymentOpenHandled?: () => void;
}) {
  const toast = useAdminToast();
  const showError = toast.error;
  const { accounts, categories, projects, customers, suppliers, loading: coreLoading } = useFinanceCore();
  const [summary, setSummary] = useState<TraitementFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const paymentRequestHandled = useRef(false);

  const stepF = traitement.steps.f;
  const isFactureDone = stepF?.status === "done";

  const load = useCallback(async () => {
    if (!isFactureDone) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/traitements/${encodeURIComponent(traitement.id)}/finance`, {
      cache: "no-store",
    });
    if (res.ok) {
      setSummary((await res.json()) as TraitementFinanceSummary);
    } else {
      setSummary(null);
      toast.error(await readApiError(res));
    }
    setLoading(false);
  }, [traitement.id, isFactureDone, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!requestPaymentOpen || paymentRequestHandled.current || loading) return;
    const doc = summary?.document;
    if (doc && doc.remainingAmount > 0) {
      paymentRequestHandled.current = true;
      setPayOpen(true);
      onPaymentOpenHandled?.();
    }
  }, [requestPaymentOpen, loading, summary?.document, onPaymentOpenHandled]);

  if (!isFactureDone) return null;
  if (loading || coreLoading) return <TraitementFinancePanelSkeleton />;

  const doc: FinanceDocument | null = summary?.document ?? null;
  const isVente = traitement.traitementType === "vente";

  return (
    <>
      <div className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h3 className={inventoryPanelTitle}>Finance — facture</h3>
          {doc ? (
            <div className="flex flex-wrap gap-2">
                <Link href={financeFactureDetailHref(doc.id)} className={btnSecondary}>
                  Voir en finance
                </Link>
              {doc.remainingAmount > 0 ? (
                <button type="button" className={btnPrimary} onClick={() => setPayOpen(true)}>
                  {isVente ? "Enregistrer encaissement" : "Enregistrer paiement"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="px-4 py-4 sm:px-5 text-sm">
          {!doc ? (
            <p className="text-[var(--graphite)]/75">
              Échéance finance indisponible. Vérifiez que la facture (étape F) est bien enregistrée avec un montant.
            </p>
          ) : (
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">N° facture</dt>
                <dd className="font-medium text-[var(--navy)]">{doc.documentNumber}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Statut</dt>
                <dd className="font-medium text-[var(--navy)]">
                  {FINANCE_PAYMENT_STATUS_LABELS[doc.paymentStatus]}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Montant TTC</dt>
                <dd className={ficheAmountClass}>{formatMoney(doc.amountTtc)} MAD</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Payé</dt>
                <dd className={ficheAmountClass}>{formatMoney(doc.paidAmount)} MAD</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--graphite)]/65">Reste</dt>
                <dd className={ficheAmountClass}>{formatMoney(doc.remainingAmount)} MAD</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {doc ? (
        <AdminDataSheet
          open={payOpen}
          onClose={() => setPayOpen(false)}
          title={isVente ? "Encaissement client" : "Paiement fournisseur"}
          description={`Traitement ${traitement.number} · ${doc.documentNumber}`}
        >
          <FinanceMovementForm
            accounts={accounts}
            categories={categories}
            defaultType={isVente ? "income" : "expense"}
            fixedMovementType={isVente ? "income" : "expense"}
            defaultCategorySlug={isVente ? "client_payment" : "supplier_payment"}
            hideTypeSelect
            lockProjectId={traitement.projectId ?? undefined}
            lockFinanceDocumentId={doc.id}
            defaultAmount={doc.remainingAmount}
            documentAmountHt={doc.amountHt}
            documentAmountTtc={doc.amountTtc}
            referencePrefix={`PAY-${doc.documentNumber.replace(/[^\w-]+/g, "-")}`}
            fixedCustomerId={doc.customerId}
            fixedSupplierId={doc.supplierId}
            referential={{ projects, customers, suppliers }}
            title=""
            onSaved={() => {
              setPayOpen(false);
              void load();
            }}
          />
        </AdminDataSheet>
      ) : null}
    </>
  );
}
