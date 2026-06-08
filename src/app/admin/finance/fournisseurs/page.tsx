import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceSuppliersPanel } from "@/components/admin/FinanceSuppliersPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Finance fournisseurs",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceSuppliersPage() {
  await requireFinancePage("/admin/finance/fournisseurs");
  return (
    <AdminShell active="finance-fournisseurs">
      <FinanceSuppliersPanel />
    </AdminShell>
  );
}
