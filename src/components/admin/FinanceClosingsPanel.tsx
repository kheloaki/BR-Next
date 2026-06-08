"use client";

import { useCallback, useEffect, useState } from "react";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceCaisseClosing } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  formGridClass,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FinanceClosingsPanel() {
  const toast = useAdminToast();
  const { accounts, loading } = useFinanceCore("cash");
  const [closings, setClosings] = useState<FinanceCaisseClosing[]>([]);
  const [accountId, setAccountId] = useState("");
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [countedBalance, setCountedBalance] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadClosings = useCallback(async () => {
    const qs = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
    const res = await fetch(`/api/admin/finance/closings${qs}`, { cache: "no-store" });
    if (res.ok) setClosings((await res.json()) as FinanceCaisseClosing[]);
  }, [accountId]);

  useEffect(() => {
    if (accounts.length && !accountId) setAccountId(accounts[0]!.id);
  }, [accounts, accountId]);

  useEffect(() => {
    void loadClosings();
  }, [loadClosings]);

  async function submitClosing() {
    setSaving(true);
    const res = await fetch("/api/admin/finance/closings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, closingDate, countedBalance, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Clôture enregistrée.");
    await loadClosings();
  }

  if (loading) return <AdminLoading />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title="Clôtures caisse" description="Contrôle journalier — solde théorique vs compté." />

      <AdminFormCard
        title="Clôture caisse journalière"
        footer={
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitClosing()}>
            {saving ? "Enregistrement…" : "Clôturer"}
          </button>
        }
      >
        <div className={formGridClass}>
          <div>
            <p className={labelClass}>Caisse</p>
            <select className={`${inputClass} mt-1`} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Date</p>
            <input type="date" className={`${inputClass} mt-1`} value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
          </div>
          <div>
            <p className={labelClass}>Solde compté (MAD)</p>
            <input type="number" className={`${inputClass} mt-1`} value={countedBalance || ""} onChange={(e) => setCountedBalance(Number(e.target.value) || 0)} />
          </div>
          <div className="sm:col-span-2">
            <p className={labelClass}>Notes</p>
            <textarea className={`${inputClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </AdminFormCard>

      <div className="mt-4">
        <AdminTableWrap>
          <thead>
            <tr>
              <th className={thClass}>Date</th>
              <th className={thClass}>Caisse</th>
              <th className={thClass}>Théorique</th>
              <th className={thClass}>Compté</th>
              <th className={thClass}>Écart</th>
            </tr>
          </thead>
          <tbody>
            {closings.map((c) => (
              <tr key={c.id} className={rowHover}>
                <td className={tdClass}>{c.closingDate}</td>
                <td className={tdClass}>{c.accountName ?? c.accountId}</td>
                <td className={tdClass}>{c.theoreticalBalance.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{c.countedBalance.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{c.difference.toLocaleString("fr-MA")}</td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      </div>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
