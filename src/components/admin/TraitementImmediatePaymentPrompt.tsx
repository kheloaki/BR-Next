"use client";

import { useCallback, useEffect, useState } from "react";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import type { TraitementFinanceSummary } from "@/lib/admin/traitement-finance-sync";
import type { Traitement } from "@/lib/admin/traitement-types";
import { btnPrimary, btnSecondary } from "@/components/admin/admin-form-styles";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";
import { TraitementPaymentPromptSkeleton } from "@/components/admin/skeletons/pages";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

export function TraitementImmediatePaymentPrompt({
  open,
  traitementId,
  traitementType,
  onClose,
  onDone,
}: {
  open: boolean;
  traitementId: string;
  traitementType: Traitement["traitementType"];
  onClose: () => void;
  onDone?: () => void;
}) {
  const { accounts, categories, projects, customers, suppliers, loading: coreLoading } = useFinanceCore();
  const [summary, setSummary] = useState<TraitementFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [payNow, setPayNow] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/traitements/${encodeURIComponent(traitementId)}/finance`, {
      cache: "no-store",
    });
    if (res.ok) {
      setSummary((await res.json()) as TraitementFinanceSummary);
    }
    setLoading(false);
  }, [traitementId]);

  useEffect(() => {
    if (open) {
      setPayNow(false);
      void load();
    }
  }, [open, load]);

  const doc = summary?.document;
  const isVente = traitementType === "vente";

  function finish() {
    onClose();
    onDone?.();
  }

  return (
    <AdminDataSheet
      open={open}
      onClose={finish}
      title={isVente ? "Encaisser maintenant ?" : "Payer maintenant ?"}
      description={
        doc
          ? `Facture ${doc.documentNumber} · reste ${formatMoney(doc.remainingAmount)} MAD`
          : "La facture a été enregistrée en finance."
      }
      footer={
        !payNow ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={finish}>
              Plus tard
            </button>
            {doc && doc.remainingAmount > 0 ? (
              <button type="button" className={btnPrimary} onClick={() => setPayNow(true)}>
                {isVente ? "Encaisser maintenant" : "Payer maintenant"}
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {loading || coreLoading ? (
        <TraitementPaymentPromptSkeleton />
      ) : payNow && doc ? (
        <FinanceMovementForm
          accounts={accounts}
          categories={categories}
          defaultType={isVente ? "income" : "expense"}
          fixedMovementType={isVente ? "income" : "expense"}
          defaultCategorySlug={isVente ? "client_payment" : "supplier_payment"}
          hideTypeSelect
          lockFinanceDocumentId={doc.id}
          defaultAmount={doc.remainingAmount}
          documentAmountHt={doc.amountHt}
          documentAmountTtc={doc.amountTtc}
          referencePrefix={`PAY-${doc.documentNumber.replace(/[^\w-]+/g, "-")}`}
          fixedCustomerId={doc.customerId}
          fixedSupplierId={doc.supplierId}
          referential={{ projects, customers, suppliers }}
          title=""
          onSaved={finish}
        />
      ) : (
        <p className="text-sm text-[var(--graphite)]/80">
          {doc
            ? "Vous pouvez enregistrer le paiement maintenant ou le faire plus tard depuis le traitement ou Finance."
            : "Synchronisation finance en cours — vous pourrez enregistrer le paiement depuis le traitement."}
        </p>
      )}
    </AdminDataSheet>
  );
}
