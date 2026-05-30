import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouvelle facture",
  robots: { index: false, follow: false },
};

export default async function FacturationFacturePage() {
  await requireAdminPage("/admin/facturation/facture");
  return (
    <AdminShell active="builder-facture">
      <Suspense fallback={<div className="rounded-md border border-border bg-white p-6 text-sm">Chargement…</div>}>
        <QuoteBuilder fixedDocumentType="facture" />
      </Suspense>
    </AdminShell>
  );
}
