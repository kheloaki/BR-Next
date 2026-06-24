"use client";

import { useEffect, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceAccount } from "@/lib/admin/finance-types";
import { moduleWrap, rowHover, tdClass, tdTextClass, thClass } from "@/components/admin/admin-form-styles";
import { FinanceTresoreriePanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";

export function FinanceTresoreriePanel() {
  const [report, setReport] = useState<{
    totalCash: number;
    totalBank: number;
    total: number;
    cash: FinanceAccount[];
    bank: FinanceAccount[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
                <th className={thClass}>Compte</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Solde MAD</th>
              </tr>
            </thead>
            <tbody>
              {[...report.cash, ...report.bank].map((a) => (
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
