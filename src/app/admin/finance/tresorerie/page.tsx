import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceTresoreriePanel } from "@/components/admin/FinanceTresoreriePanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Trésorerie",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceTresoreriePage() {
  await requireFinancePage("/admin/finance/tresorerie");
  return (
    <AdminShell active="finance-tresorerie">
      <FinanceTresoreriePanel />
    </AdminShell>
  );
}
