import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceDocumentDetailPanel } from "@/components/admin/FinanceDocumentDetailPanel";
import { requireFinancePage } from "@/lib/admin/finance-page-auth";

export const metadata: Metadata = {
  title: "Fiche facture",
  robots: { index: false, follow: false },
};

export default async function AdminFinanceFactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireFinancePage("/admin/finance/factures");
  const { id } = await params;
  return (
    <AdminShell active="finance-factures">
      <FinanceDocumentDetailPanel documentId={id} />
    </AdminShell>
  );
}
