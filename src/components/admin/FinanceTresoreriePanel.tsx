"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceAccount } from "@/lib/admin/finance-types";
import { moduleWrap, rowHover, tdClass } from "@/components/admin/admin-form-styles";
import { FinanceTresoreriePanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { useTableSort } from "@/components/admin/ux/useTableSort";

export function FinanceTresoreriePanel() {
  const [report, setReport] = useState<{
    totalCash: number;
    totalBank: number;
    total: number;
    cash: FinanceAccount[];
    bank: FinanceAccount[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { sort, onSort, applySort } = useTableSort("name");

  const accounts = useMemo(
    () => (report ? [...report.cash, ...report.bank] : []),
    [report],
  );

  const sortAccessors = useMemo(
    () => ({
      name: (a: FinanceAccount) => a.name,
      accountType: (a: FinanceAccount) => (a.accountType === "cash" ? "Caisse" : "Banque"),
      balance: (a: FinanceAccount) => a.balance ?? 0,
    }),
    [],
  );

  const sortedAccounts = useMemo(
    () => applySort(accounts, sortAccessors),
    [accounts, sortAccessors, applySort],
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/finance/reports?kind=tresorerie", { cache: "no-store" });
      if (res.ok) setReport(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading) return <FinanceTresoreriePanelSkeleton />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Trésorerie"
        description="Vue consolidée caisse + banque."
        exportHref="/api/admin/finance/reports?kind=tresorerie&format=csv"
      />

      {report ? (
        <>
          <AdminMiniStats
            items={[
              { label: "Total caisse", value: `${report.totalCash.toLocaleString("fr-MA")} MAD` },
              { label: "Total banque", value: `${report.totalBank.toLocaleString("fr-MA")} MAD` },
              { label: "Trésorerie", value: `${report.total.toLocaleString("fr-MA")} MAD`, accent: "alert" },
            ]}
          />

          <AdminTableWrap>
            <thead>
              <tr>
                <AdminSortableTh label="Compte" sortKey="name" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Type" sortKey="accountType" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Solde MAD" sortKey="balance" sort={sort} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map((a) => (
                <tr key={a.id} className={rowHover}>
                  <td className={tdClass}>
                    <AdminTruncatedText text={a.name} lines={1} />
                  </td>
                  <td className={tdClass}>{a.accountType === "cash" ? "Caisse" : "Banque"}</td>
                  <td className={tdClass}>{(a.balance ?? 0).toLocaleString("fr-MA")}</td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        </>
      ) : null}
    </div>
  );
}
