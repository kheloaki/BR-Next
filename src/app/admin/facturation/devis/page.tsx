import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { QuoteBuilderSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouveau devis",
  robots: { index: false, follow: false },
};

export default async function FacturationDevisPage() {
  await requireAdminPage("/admin/facturation/devis");
  return (
    <AdminShell active="builder-devis">
      <Suspense fallback={<QuoteBuilderSkeleton />}>
        <QuoteBuilder fixedDocumentType="devis" />
      </Suspense>
    </AdminShell>
  );
}
