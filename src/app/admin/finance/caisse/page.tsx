import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceCaisseBanquePanel } from "@/components/admin/FinanceCaisseBanquePanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Caisse & banque",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceCaissePage() {
  await requireFinancePage("/admin/finance/caisse");
  return (
    <AdminShell active="finance-caisse">
      <FinanceCaisseBanquePanel />
    </AdminShell>
  );
}
