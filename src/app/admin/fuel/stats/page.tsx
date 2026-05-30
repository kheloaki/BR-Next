import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Carburant par engin",
  robots: { index: false, follow: false },
};

export default async function AdminFuelStatsPage() {
  await requireAdminPage("/admin/fuel/stats");
  return (
    <AdminShell active="fuel-stats">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="stats" />
      </Suspense>
    </AdminShell>
  );
}
