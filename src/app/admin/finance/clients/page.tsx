import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceClientsPanel } from "@/components/admin/FinanceClientsPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Finance clients",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceClientsPage() {
  await requireFinancePage("/admin/finance/clients");
  return (
    <AdminShell active="finance-clients">
      <FinanceClientsPanel />
    </AdminShell>
  );
}
