"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { FINANCE_DOCUMENT_TYPE_LABELS, FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
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

export function FinanceClientsPanel() {
  const toast = useAdminToast();
  const { accounts, categories, projects, customers, suppliers, loading: coreLoading } = useFinanceCore();
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDocId, setPayDocId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payAccountId, setPayAccountId] = useState("");

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/finance/documents?type=client_invoice", { cache: "no-store" });
    if (res.ok) setDocuments((await res.json()) as FinanceDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  async function recordPayment() {
    if (!payDocId || !payAccountId || payAmount <= 0) return;
    const doc = documents.find((d) => d.id === payDocId);
    const cat = categories.find((c) => c.slug === "client_payment");
    if (!cat) {
      toast.error("Catégorie encaissement client introuvable.");
      return;
    }
    const ref = `PAY-CLI-${Date.now()}`;
    const movRes = await fetch("/api/admin/finance/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: payAccountId,
        categoryId: cat.id,
        movementType: "income",
        amount: payAmount,
        movementDate: new Date().toISOString().slice(0, 10),
        reference: ref,
        customerId: doc?.customerId,
        projectId: doc?.projectId,
        paymentMethod: "cash",
      }),
    });
    if (!movRes.ok) {
      toast.error(await readApiError(movRes));
      return;
    }
    const movement = (await movRes.json()) as { id: string };
    const allocRes = await fetch("/api/admin/finance/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movementId: movement.id,
        targetType: "finance_document",
        targetId: payDocId,
        allocatedAmount: payAmount,
      }),
    });
    if (!allocRes.ok) {
      toast.error(await readApiError(allocRes));
      return;
    }
    toast.success("Paiement client enregistré.");
    setPayDocId(null);
    await loadDocs();
  }

  if (loading || coreLoading) return <AdminLoading />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Finance clients"
        description="Factures enregistrées, encaissements et impayés."
        exportHref="/api/admin/finance/reports?kind=balance_clients&format=csv"
      />

      <AdminInventoryCard title="Factures clients (finance)">
        {documents.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--graphite)]/70">
            Aucune facture enregistrée en finance. Utilisez « Enregistrer en finance » depuis Facturation.
          </p>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>N°</th>
                <th className={thClass}>Client</th>
                <th className={thClass}>TTC</th>
                <th className={thClass}>Payé</th>
                <th className={thClass}>Reste</th>
                <th className={thClass}>Statut</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className={rowHover}>
                  <td className={tdClass}>{d.documentNumber}</td>
                  <td className={tdClass}>{d.customerName ?? "—"}</td>
                  <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{d.paidAmount.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
                  <td className={tdClass}>
                    {d.remainingAmount > 0 ? (
                      <button type="button" className={btnSecondary} onClick={() => { setPayDocId(d.id); setPayAmount(d.remainingAmount); }}>
                        Encaisser
                      </button>
                    ) : null}
                    {d.customerId ? (
                      <Link href={`/admin/finance/clients/${d.customerId}`} className={`${btnSecondary} ml-1`}>
                        Fiche
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      {payDocId ? (
        <div className="mt-4">
          <AdminFormCard
            title="Encaissement client"
            footer={
              <button type="button" className={btnPrimary} onClick={() => void recordPayment()}>
                Enregistrer le paiement
              </button>
            }
          >
            <div className="grid gap-3 max-w-md">
              <div>
                <p className={labelClass}>Compte</p>
                <select className={`${inputClass} mt-1`} value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}>
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className={labelClass}>Montant MAD</p>
                <input type="number" className={`${inputClass} mt-1`} value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value) || 0)} />
              </div>
            </div>
          </AdminFormCard>
        </div>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}

export function FinanceClientDetailPanel({ customerId }: { customerId: string }) {
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    void (async () => {
      const [docRes, custRes] = await Promise.all([
        fetch(`/api/admin/finance/documents?customerId=${encodeURIComponent(customerId)}`, { cache: "no-store" }),
        fetch("/api/admin/customers", { cache: "no-store" }),
      ]);
      if (docRes.ok) setDocuments((await docRes.json()) as FinanceDocument[]);
      if (custRes.ok) {
        const list = (await custRes.json()) as { id: string; name: string }[];
        setCustomerName(list.find((c) => c.id === customerId)?.name ?? "");
      }
    })();
  }, [customerId]);

  const remaining = documents.reduce((s, d) => s + d.remainingAmount, 0);

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title={`Fiche finance — ${customerName || customerId}`} description="Solde et historique client." />
      <p className="text-sm mb-4">Solde client : <strong>{remaining.toLocaleString("fr-MA")} MAD</strong></p>
      <AdminTableWrap>
        <thead>
          <tr>
            <th className={thClass}>N°</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>TTC</th>
            <th className={thClass}>Reste</th>
            <th className={thClass}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id} className={rowHover}>
              <td className={tdClass}>{d.documentNumber}</td>
              <td className={tdClass}>{FINANCE_DOCUMENT_TYPE_LABELS[d.documentType]}</td>
              <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
              <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
              <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
            </tr>
          ))}
        </tbody>
      </AdminTableWrap>
    </div>
  );
}
