import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { QuoteBuilderSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouvelle facture",
  robots: { index: false, follow: false },
};

export default async function FacturationFacturePage() {
  await requireAdminPage("/admin/facturation/facture");
  return (
    <AdminShell active="builder-facture">
      <Suspense fallback={<QuoteBuilderSkeleton />}>
        <QuoteBuilder fixedDocumentType="facture" />
      </Suspense>
    </AdminShell>
  );
}
