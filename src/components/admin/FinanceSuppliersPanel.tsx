"use client";

import { useCallback, useEffect, useState } from "react";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FinanceSuppliersPanel() {
  const toast = useAdminToast();
  const { accounts, categories, loading: coreLoading } = useFinanceCore();
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [amountTtc, setAmountTtc] = useState(0);
  const [docNumber, setDocNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [payDocId, setPayDocId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payAccountId, setPayAccountId] = useState("");

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/finance/documents?type=supplier_invoice", { cache: "no-store" });
    if (res.ok) setDocuments((await res.json()) as FinanceDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDocs();
    void fetch("/api/admin/suppliers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSuppliers(d as { id: string; name: string }[]));
  }, [loadDocs]);

  async function createSupplierInvoice() {
    const res = await fetch("/api/admin/finance/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        documentType: "supplier_invoice",
        supplierId,
        documentNumber: docNumber,
        amountTtc,
        amountHt: amountTtc,
        dueDate: dueDate || null,
      }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Facture fournisseur enregistrée.");
    setShowCreate(false);
    await loadDocs();
  }

  async function recordPayment() {
    if (!payDocId || !payAccountId || payAmount <= 0) return;
    const doc = documents.find((d) => d.id === payDocId);
    const cat = categories.find((c) => c.slug === "supplier_payment");
    if (!cat) return;
    const ref = `PAY-FOU-${Date.now()}`;
    const movRes = await fetch("/api/admin/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: payAccountId,
        categoryId: cat.id,
        movementType: "expense",
        amount: payAmount,
        movementDate: new Date().toISOString().slice(0, 10),
        reference: ref,
        supplierId: doc?.supplierId,
        projectId: doc?.projectId,
      }),
    });
    if (!movRes.ok) {
      toast.error(await readApiError(movRes));
      return;
    }
    const movement = (await movRes.json()) as { id: string };
    await fetch("/api/admin/finance/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movementId: movement.id,
        targetType: "finance_document",
        targetId: payDocId,
        allocatedAmount: payAmount,
      }),
    });
    toast.success("Paiement fournisseur enregistré.");
    setPayDocId(null);
    await loadDocs();
  }

  if (loading || coreLoading) return <AdminLoading />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Finance fournisseurs"
        description="Dettes fournisseurs et décaissements."
        exportHref="/api/admin/finance/reports?kind=balance_fournisseurs&format=csv"
      />

      <button type="button" className={`${btnSecondary} mb-4`} onClick={() => setShowCreate(true)}>
        + Facture fournisseur
      </button>

      <AdminInventoryCard title="Factures fournisseurs">
        <AdminTableWrap>
          <thead>
            <tr>
              <th className={thClass}>N°</th>
              <th className={thClass}>Fournisseur</th>
              <th className={thClass}>TTC</th>
              <th className={thClass}>Reste</th>
              <th className={thClass}>Statut</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className={rowHover}>
                <td className={tdClass}>{d.documentNumber}</td>
                <td className={tdClass}>{d.supplierName ?? "—"}</td>
                <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
                <td className={tdClass}>
                  {d.remainingAmount > 0 ? (
                    <button type="button" className={btnSecondary} onClick={() => { setPayDocId(d.id); setPayAmount(d.remainingAmount); }}>
                      Payer
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      </AdminInventoryCard>

      {showCreate ? (
        <AdminFormCard
          title="Nouvelle facture fournisseur"
          footer={<button type="button" className={btnPrimary} onClick={() => void createSupplierInvoice()}>Enregistrer</button>}
        >
          <select className={`${inputClass} mb-2`} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Fournisseur…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className={`${inputClass} mb-2`} placeholder="N° facture" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          <input type="number" className={`${inputClass} mb-2`} placeholder="Montant TTC" value={amountTtc || ""} onChange={(e) => setAmountTtc(Number(e.target.value) || 0)} />
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </AdminFormCard>
      ) : null}

      {payDocId ? (
        <AdminFormCard title="Paiement fournisseur" footer={<button type="button" className={btnPrimary} onClick={() => void recordPayment()}>Valider</button>}>
          <select className={`${inputClass} mb-2`} value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}>
            <option value="">Compte…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="number" className={inputClass} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value) || 0)} />
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
