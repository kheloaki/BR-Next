import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceCaissePanel } from "@/components/admin/FinanceCaissePanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Caisse",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceCaissePage() {
  await requireFinancePage("/admin/finance/caisse");
  return (
    <AdminShell active="finance-caisse">
      <FinanceCaissePanel />
    </AdminShell>
  );
}
