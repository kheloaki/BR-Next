"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FinanceBanquePanel } from "@/components/admin/FinanceBanquePanel";
import { FinanceCaissePanel } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { moduleWrap } from "@/components/admin/admin-form-styles";

type TabId = "caisse" | "banque";

export function FinanceCaisseBanquePanel() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<TabId>(tabParam === "banque" ? "banque" : "caisse");

  useEffect(() => {
    if (tabParam === "banque" || tabParam === "caisse") {
      setTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Caisse & banque"
        description="Journal caisse, comptes bancaires, entrées/sorties et virements."
      />

      <AdminTabs
        tabs={[
          { id: "caisse", label: "Caisse" },
          { id: "banque", label: "Banque" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />

      {tab === "caisse" ? <FinanceCaissePanel embedded /> : <FinanceBanquePanel embedded />}
    </div>
  );
}
