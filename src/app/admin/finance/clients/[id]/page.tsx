import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceClientDetailPanel } from "@/components/admin/FinanceClientsPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Fiche client finance",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFinancePage("/admin/finance/clients");
  const { id } = await params;
  return (
    <AdminShell active="finance-factures">
      <FinanceClientDetailPanel customerId={id} />
    </AdminShell>
  );
}
