import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceClosingsPanel } from "@/components/admin/FinanceClosingsPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Clôtures caisse",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceCloturesPage() {
  await requireFinancePage("/admin/finance/clotures");
  return (
    <AdminShell active="finance-clotures">
      <FinanceClosingsPanel />
    </AdminShell>
  );
}
