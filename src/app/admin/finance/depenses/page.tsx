import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceExpensesPanel } from "@/components/admin/FinanceExpensesPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Dépenses",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceDepensesPage() {
  await requireFinancePage("/admin/finance/depenses");
  return (
    <AdminShell active="finance-depenses">
      <FinanceExpensesPanel />
    </AdminShell>
  );
}
