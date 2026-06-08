"use client";

import { useCallback, useEffect, useState } from "react";
import { FinanceJournalTable, FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceAccount } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  moduleWrap,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FinanceBanquePanel() {
  const toast = useAdminToast();
  const { accounts, categories, movements, projects, customers, suppliers, loading, load, loadMovements } =
    useFinanceCore("bank");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBank, setNewBank] = useState("");
  const [newRib, setNewRib] = useState("");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferRef, setTransferRef] = useState("");
  const [cashAccounts, setCashAccounts] = useState<FinanceAccount[]>([]);

  useEffect(() => {
    void fetch("/api/admin/finance/accounts?type=cash", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCashAccounts(data as FinanceAccount[]));
  }, []);

  useEffect(() => {
    if (accounts.length && !selectedAccountId) setSelectedAccountId(accounts[0]!.id);
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId) void loadMovements(selectedAccountId, dateFrom, dateTo);
  }, [selectedAccountId, dateFrom, dateTo, loadMovements]);

  const selected = accounts.find((a) => a.id === selectedAccountId);

  async function createBank() {
    const res = await fetch("/api/admin/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName || "Compte bancaire",
        accountType: "bank",
        bankName: newBank,
        rib: newRib,
        isDefault: accounts.length === 0,
      }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Compte bancaire créé.");
    setShowForm(false);
    await load();
  }

  async function submitTransfer() {
    const res = await fetch("/api/admin/finance/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: transferAmount,
        movementDate: new Date().toISOString().slice(0, 10),
        reference: transferRef,
      }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Transfert enregistré.");
    await load();
    if (selectedAccountId) await loadMovements(selectedAccountId, dateFrom, dateTo);
  }

  if (loading) return <AdminLoading />;

  const allAccounts = [...cashAccounts, ...accounts];

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title="Banque" description="Comptes bancaires, mouvements, chèques et virements." />

      {accounts.length === 0 ? (
        <AdminFormCard
          title="Créer un compte bancaire"
          footer={
            <button type="button" className={btnPrimary} onClick={() => void createBank()}>
              Enregistrer
            </button>
          }
        >
          <div className={formGridClass}>
            <div>
              <p className={labelClass}>Nom</p>
              <input className={`${inputClass} mt-1`} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Compte BMCE" />
            </div>
            <div>
              <p className={labelClass}>Banque</p>
              <input className={`${inputClass} mt-1`} value={newBank} onChange={(e) => setNewBank(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>RIB</p>
              <input className={`${inputClass} mt-1`} value={newRib} onChange={(e) => setNewRib(e.target.value)} />
            </div>
          </div>
        </AdminFormCard>
      ) : (
        <>
          <AdminMiniStats
            items={[
              { label: "Solde banque", value: `${(selected?.balance ?? 0).toLocaleString("fr-MA")} MAD` },
              { label: "Comptes", value: String(accounts.length) },
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-4">
            <select className={inputClass} value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {(a.balance ?? 0).toLocaleString("fr-MA")} MAD
                </option>
              ))}
            </select>
            <button type="button" className={btnSecondary} onClick={() => setShowForm(true)}>
              + Compte
            </button>
          </div>

          <FinanceMovementForm
            accounts={accounts}
            categories={categories}
            defaultAccountId={selectedAccountId}
            defaultType="expense"
            referential={{ projects, customers, suppliers }}
            title="Mouvement bancaire"
            onSaved={async () => {
              await load();
              if (selectedAccountId) await loadMovements(selectedAccountId, dateFrom, dateTo);
            }}
          />

          <div className="mt-4">
            <AdminFormCard title="Transfert caisse ↔ banque">
              <div className={formGridClass}>
                <div>
                  <p className={labelClass}>De</p>
                  <select className={`${inputClass} mt-1`} value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)}>
                    <option value="">—</option>
                    {allAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.accountType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className={labelClass}>Vers</p>
                  <select className={`${inputClass} mt-1`} value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                    <option value="">—</option>
                    {allAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.accountType})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className={labelClass}>Montant</p>
                  <input type="number" className={`${inputClass} mt-1`} value={transferAmount || ""} onChange={(e) => setTransferAmount(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <p className={labelClass}>Référence</p>
                  <input className={`${inputClass} mt-1`} value={transferRef} onChange={(e) => setTransferRef(e.target.value)} />
                </div>
              </div>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={() => void submitTransfer()}>
                Valider le transfert
              </button>
            </AdminFormCard>
          </div>

          <AdminInventoryCard title="Journal banque">
            <FinanceJournalTable movements={movements} />
          </AdminInventoryCard>
        </>
      )}

      {showForm ? (
        <div className="mt-4">
          <AdminFormCard
            title="Nouveau compte bancaire"
            footer={
              <button type="button" className={btnPrimary} onClick={() => void createBank()}>
                Créer
              </button>
            }
          >
            <input className={`${inputClass} mb-2`} placeholder="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input className={`${inputClass} mb-2`} placeholder="Banque" value={newBank} onChange={(e) => setNewBank(e.target.value)} />
            <input className={inputClass} placeholder="RIB" value={newRib} onChange={(e) => setNewRib(e.target.value)} />
          </AdminFormCard>
        </div>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
