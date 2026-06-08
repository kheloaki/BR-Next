"use client";

import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { moduleWrap } from "@/components/admin/admin-form-styles";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";

export function FinanceExpensesPanel() {
  const { accounts, categories, projects, customers, suppliers, loading, load } = useFinanceCore();

  if (loading) return <AdminLoading />;

  const expenseCategories = categories.filter((c) => c.direction === "expense" || c.direction === "both");

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Dépenses"
        description="Saisie des dépenses — enregistrées en finance uniquement (séparé des opérations)."
      />
      <FinanceMovementForm
        accounts={accounts}
        categories={expenseCategories}
        defaultType="expense"
        referential={{ projects, customers, suppliers }}
        title="Nouvelle dépense"
        onSaved={() => void load()}
      />
    </div>
  );
}
