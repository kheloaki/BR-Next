import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductionManager } from "@/components/admin/ProductionManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Production",
  robots: { index: false, follow: false },
};

export default async function AdminProductionPage() {
  await requireAdminPage("/admin/production");
  return (
    <AdminShell active="production">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <ProductionManager />
      </Suspense>
    </AdminShell>
  );
}
