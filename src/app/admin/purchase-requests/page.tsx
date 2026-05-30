import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PurchaseRequestsManager } from "@/components/admin/PurchaseRequestsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Demandes d'achat",
  robots: { index: false, follow: false },
};

export default async function AdminPurchaseRequestsPage() {
  await requireAdminPage("/admin/purchase-requests");
  return (
    <AdminShell active="purchase-requests">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <PurchaseRequestsManager />
      </Suspense>
    </AdminShell>
  );
}
