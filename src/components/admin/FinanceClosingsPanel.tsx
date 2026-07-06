"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FinanceAccountSelect } from "@/components/admin/FinanceAccountSelect";
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
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { FinanceClosingsPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { formatDateFr, formatDateTimeFr } from "@/lib/admin/date-time-fr";

export function FinanceClosingsPanel() {
  const toast = useAdminToast();
  const { accounts, loading } = useFinanceCore("cash");
  const [closings, setClosings] = useState<FinanceCaisseClosing[]>([]);
  const [accountId, setAccountId] = useState("");
  const [closingDate, setClosingDate] = useState(new Date().toISOString().slice(0, 10));
  const [countedBalance, setCountedBalance] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { sort, onSort, applySort } = useTableSort("closingDate");

  const sortAccessors = useMemo(
    () => ({
      closingDate: (c: FinanceCaisseClosing) => c.closingDate,
      account: (c: FinanceCaisseClosing) => c.accountName ?? c.accountId,
      theoreticalBalance: (c: FinanceCaisseClosing) => c.theoreticalBalance,
      countedBalance: (c: FinanceCaisseClosing) => c.countedBalance,
      difference: (c: FinanceCaisseClosing) => c.difference,
    }),
    [],
  );

  const sortedClosings = useMemo(
    () => applySort(closings, sortAccessors),
    [closings, sortAccessors, applySort],
  );

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

  if (loading) return <FinanceClosingsPanelSkeleton />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title="Clôtures caisse" description="Contrôle journalier — solde théorique vs compté." exportHref="/api/admin/finance/closings" />

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
            <div className="mt-1">
              <FinanceAccountSelect
                accounts={accounts}
                value={accountId}
                onChange={setAccountId}
                inputClassName={inputClass}
                placeholder="Sélectionner…"
              />
            </div>
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
              <AdminSortableTh label="Date" sortKey="closingDate" sort={sort} onSort={onSort} />
              <AdminSortableTh label="Caisse" sortKey="account" sort={sort} onSort={onSort} />
              <AdminSortableTh label="Théorique" sortKey="theoreticalBalance" sort={sort} onSort={onSort} align="right" />
              <AdminSortableTh label="Compté" sortKey="countedBalance" sort={sort} onSort={onSort} align="right" />
              <AdminSortableTh label="Écart" sortKey="difference" sort={sort} onSort={onSort} align="right" />
            </tr>
          </thead>
          <tbody>
            {sortedClosings.map((c) => (
              <tr key={c.id} className={rowHover}>
                <td className={tdClass}>{formatDateFr(c.closingDate)}</td>
                <td className={tdClass}>
                  <AdminTruncatedText text={c.accountName ?? c.accountId} lines={1} />
                </td>
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
