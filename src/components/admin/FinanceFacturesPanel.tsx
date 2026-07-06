"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FinanceClientsPanel } from "@/components/admin/FinanceClientsPanel";
import { FinanceSuppliersPanel } from "@/components/admin/FinanceSuppliersPanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceFacturesTab } from "@/lib/admin/finance-nav";
import { moduleWrap } from "@/components/admin/admin-form-styles";

export function FinanceFacturesPanel() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<FinanceFacturesTab>(tabParam === "fournisseurs" ? "fournisseurs" : "clients");

  useEffect(() => {
    if (tabParam === "fournisseurs" || tabParam === "clients") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const exportHref =
    tab === "clients"
      ? "/api/admin/finance/reports?kind=balance_clients"
      : "/api/admin/finance/reports?kind=balance_fournisseurs";

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Factures"
        description="Factures clients et fournisseurs — encaissements, paiements et impayés."
        exportHref={exportHref}
      />

      <AdminTabs
        tabs={[
          { id: "clients", label: "Clients" },
          { id: "fournisseurs", label: "Fournisseurs" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as FinanceFacturesTab)}
      />

      {tab === "clients" ? <FinanceClientsPanel embedded /> : <FinanceSuppliersPanel embedded />}
    </div>
  );
}
