import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceBanquePanel } from "@/components/admin/FinanceBanquePanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Banque",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceBanquePage() {
  await requireFinancePage("/admin/finance/banque");
  return (
    <AdminShell active="finance-banque">
      <FinanceBanquePanel />
    </AdminShell>
  );
}
