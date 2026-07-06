"use client";

import { useCallback, useEffect, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
import { FinanceExpenseForm } from "@/components/admin/FinanceExpenseForm";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceCategory } from "@/lib/admin/finance-types";
import { moduleWrap } from "@/components/admin/admin-form-styles";
import { FinanceExpensesPanelSkeleton } from "@/components/admin/skeletons/pages";

export function FinanceExpensesPanel() {
  const { accounts, categories: coreCategories, projects, loading, load } = useFinanceCore();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [referentialLoading, setReferentialLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    const res = await fetch("/api/admin/suppliers", { cache: "no-store" });
    if (res.ok) setSuppliers((await res.json()) as Supplier[]);
  }, []);

  useEffect(() => {
    setCategories(coreCategories.filter((c) => c.direction === "expense" || c.direction === "both"));
  }, [coreCategories]);

  useEffect(() => {
    if (loading) return;
    setReferentialLoading(true);
    void loadSuppliers().finally(() => setReferentialLoading(false));
  }, [loading, loadSuppliers]);

  async function refreshAll() {
    await load();
    await loadSuppliers();
  }

  if (loading || referentialLoading) return <FinanceExpensesPanelSkeleton />;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Dépenses"
        description="Sorties caisse / banque — montant HT/TTC, fournisseur et catégorie."
        exportHref="/api/admin/finance/reports?kind=depenses_categorie"
      />
      <FinanceExpenseForm
        accounts={accounts}
        categories={categories}
        projects={projects}
        suppliers={suppliers}
        onSupplierAdded={(supplier) => setSuppliers((prev) => [...prev, supplier])}
        onCategoryAdded={(category) => setCategories((prev) => [...prev, category])}
        onSaved={() => void refreshAll()}
      />
    </div>
  );
}
