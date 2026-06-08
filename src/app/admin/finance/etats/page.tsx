import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceEtatsPanel } from "@/components/admin/FinanceEtatsPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "États finance",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceEtatsPage() {
  await requireFinancePage("/admin/finance/etats");
  return (
    <AdminShell active="finance-etats">
      <FinanceEtatsPanel />
    </AdminShell>
  );
}
