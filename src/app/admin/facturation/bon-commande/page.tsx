import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { QuoteBuilderSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouveau bon de commande",
  robots: { index: false, follow: false },
};

export default async function FacturationBonCommandePage() {
  await requireAdminPage("/admin/facturation/bon-commande");
  return (
    <AdminShell active="builder-bon-commande">
      <Suspense fallback={<QuoteBuilderSkeleton />}>
        <QuoteBuilder fixedDocumentType="bon_commande" />
      </Suspense>
    </AdminShell>
  );
}
