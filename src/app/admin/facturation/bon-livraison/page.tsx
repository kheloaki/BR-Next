import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouveau bon de livraison",
  robots: { index: false, follow: false },
};

export default async function FacturationBonLivraisonPage() {
  await requireAdminPage("/admin/facturation/bon-livraison");
  return (
    <AdminShell active="builder-bon-livraison">
      <QuoteBuilder fixedDocumentType="bon_livraison" />
    </AdminShell>
  );
}
