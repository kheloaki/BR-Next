import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceFacturesPanel } from "@/components/admin/FinanceFacturesPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Factures",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceFacturesPage() {
  await requireFinancePage("/admin/finance/factures");
  return (
    <AdminShell active="finance-factures">
      <FinanceFacturesPanel />
    </AdminShell>
  );
}
