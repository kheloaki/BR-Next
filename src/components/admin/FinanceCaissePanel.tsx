"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FinanceAccountSelect } from "@/components/admin/FinanceAccountSelect";
import { FinanceJournalTable, FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { AdminProject } from "@/components/admin/operations-types";
import type { FinanceAccount, FinanceCategory, FinanceMovement } from "@/lib/admin/finance-types";
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
import { FinanceCaissePanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function useFinanceCore(accountType?: "cash" | "bank") {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [movements, setMovements] = useState<FinanceMovement[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const typeQs = accountType ? `?type=${accountType}` : "";
    const [accRes, catRes, projRes, custRes, supRes] = await Promise.all([
      fetch(`/api/admin/finance/accounts${typeQs}`, { cache: "no-store" }),
      fetch("/api/admin/finance/categories", { cache: "no-store" }),
      fetch("/api/admin/projects", { cache: "no-store" }),
      fetch("/api/admin/customers", { cache: "no-store" }),
      fetch("/api/admin/suppliers", { cache: "no-store" }),
    ]);
    if (accRes.ok) setAccounts((await accRes.json()) as FinanceAccount[]);
    if (catRes.ok) setCategories((await catRes.json()) as FinanceCategory[]);
    if (projRes.ok) {
      setProjects((await projRes.json()) as AdminProject[]);
    }
    if (custRes.ok) setCustomers((await custRes.json()) as { id: string; name: string }[]);
    if (supRes.ok) setSuppliers((await supRes.json()) as { id: string; name: string }[]);
    setLoading(false);
  }, [accountType]);

  const loadMovements = useCallback(
    async (accountId: string, from: string, to: string) => {
      const qs = new URLSearchParams({ accountId, from, to });
      const res = await fetch(`/api/admin/finance/movements?${qs}`, { cache: "no-store" });
      if (res.ok) setMovements((await res.json()) as FinanceMovement[]);
    },
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    accounts,
    categories,
    movements,
    setMovements,
    projects,
    customers,
    suppliers,
    loading,
    load,
    loadMovements,
  };
}

export function FinanceCaissePanel({ embedded = false }: { embedded?: boolean }) {
  const toast = useAdminToast();
  const { accounts, categories, movements, projects, customers, suppliers, loading, load, loadMovements } =
    useFinanceCore("cash");
  const [tab, setTab] = useState<"journal" | "entry" | "exit">("journal");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("Caisse principale");
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    if (accounts.length && !selectedAccountId) {
      const def = accounts.find((a) => a.isDefault) ?? accounts[0];
      setSelectedAccountId(def?.id ?? "");
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId) void loadMovements(selectedAccountId, dateFrom, dateTo);
  }, [selectedAccountId, dateFrom, dateTo, loadMovements]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const balance = selectedAccount?.balance ?? 0;

  const periodStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const m of movements) {
      if (m.movementType === "income") income += m.amount;
      if (m.movementType === "expense") expense += m.amount;
    }
    return { income, expense };
  }, [movements]);

  async function createAccount() {
    setSavingAccount(true);
    const res = await fetch("/api/admin/finance/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAccountName, accountType: "cash", isDefault: true }),
    });
    setSavingAccount(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Caisse créée.");
    setShowCreateAccount(false);
    await load();
  }

  async function voidMovement(id: string) {
    if (!confirm("Annuler ce mouvement ?")) return;
    const res = await fetch("/api/admin/finance/movements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "void", voidReason: "Annulation manuelle" }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement annulé.");
    if (selectedAccountId) await loadMovements(selectedAccountId, dateFrom, dateTo);
    await load();
  }

  const exportHref =
    selectedAccountId &&
    `/api/admin/finance/movements?accountId=${encodeURIComponent(selectedAccountId)}&from=${dateFrom}&to=${dateTo}`;

  if (loading) return <FinanceCaissePanelSkeleton />;

  const content = (
    <>
      {accounts.length === 0 ? (
        <AdminFormCard
          title="Initialiser la caisse"
          footer={
            <button type="button" className={btnPrimary} disabled={savingAccount} onClick={() => void createAccount()}>
              {savingAccount ? "Création…" : "Créer la caisse"}
            </button>
          }
        >
          <div className={formGridClass}>
            <div className="sm:col-span-2">
              <p className={labelClass}>Nom de la caisse</p>
              <input className={`${inputClass} mt-1`} value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
            </div>
          </div>
        </AdminFormCard>
      ) : (
        <>
          <AdminMiniStats
            items={[
              { label: "Solde caisse", value: `${balance.toLocaleString("fr-MA")} MAD` },
              { label: "Entrées période", value: `${periodStats.income.toLocaleString("fr-MA")} MAD` },
              { label: "Sorties période", value: `${periodStats.expense.toLocaleString("fr-MA")} MAD` },
            ]}
          />

          <div className="flex flex-wrap gap-2 items-end mb-4">
            <div>
              <p className={labelClass}>Caisse</p>
              <div className="mt-1">
                <FinanceAccountSelect
                  accounts={accounts}
                  value={selectedAccountId}
                  onChange={setSelectedAccountId}
                  inputClassName={`${inputClass} min-w-[200px]`}
                  placeholder="Sélectionner…"
                />
              </div>
            </div>
            <div>
              <p className={labelClass}>Du</p>
              <input type="date" className={`${inputClass} mt-1`} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Au</p>
              <input type="date" className={`${inputClass} mt-1`} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button type="button" className={`${btnSecondary} mt-5`} onClick={() => setShowCreateAccount(true)}>
              + Caisse
            </button>
          </div>

          <AdminTabs
            tabs={[
              { id: "journal", label: "Journal" },
              { id: "entry", label: "Entrée caisse" },
              { id: "exit", label: "Sortie caisse" },
            ]}
            active={tab}
            onChange={(id) => setTab(id as "journal" | "entry" | "exit")}
          />

          {tab === "journal" ? (
            <AdminInventoryCard title="Journal de caisse">
              {movements.length === 0 ? (
                <p className="px-5 py-10 text-sm text-[var(--graphite)]/70">Aucun mouvement sur cette période.</p>
              ) : (
                <FinanceJournalTable movements={movements} onVoid={(id) => void voidMovement(id)} />
              )}
            </AdminInventoryCard>
          ) : null}

          {tab === "entry" || tab === "exit" ? (
            <FinanceMovementForm
              accounts={accounts}
              categories={categories}
              defaultAccountId={selectedAccountId}
              defaultType={tab === "entry" ? "income" : "expense"}
              referential={{ projects, customers, suppliers }}
              title={tab === "entry" ? "Entrée caisse" : "Sortie caisse"}
              onSaved={async () => {
                await load();
                if (selectedAccountId) await loadMovements(selectedAccountId, dateFrom, dateTo);
                setTab("journal");
              }}
            />
          ) : null}

          {showCreateAccount ? (
            <div className="mt-4">
              <AdminFormCard
                title="Nouvelle caisse"
                footer={
                  <div className="flex gap-2">
                    <button type="button" className={btnSecondary} onClick={() => setShowCreateAccount(false)}>
                      Annuler
                    </button>
                    <button type="button" className={btnPrimary} disabled={savingAccount} onClick={() => void createAccount()}>
                      Créer
                    </button>
                  </div>
                }
              >
                <input className={inputClass} value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
              </AdminFormCard>
            </div>
          ) : null}
        </>
      )}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );

  if (embedded) return content;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Caisse"
        description="Entrées et sorties caisse — journal, solde et export."
        exportHref={exportHref || undefined}
      />
      {content}
    </div>
  );
}
