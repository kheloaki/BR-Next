import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Stock gasoil",
  robots: { index: false, follow: false },
};

export default async function AdminFuelStockPage() {
  await requireAdminPage("/admin/fuel/stock");
  return (
    <AdminShell active="fuel-stock">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="stock" />
      </Suspense>
    </AdminShell>
  );
}
