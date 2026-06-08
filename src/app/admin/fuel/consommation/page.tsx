import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelMaterialConsumptionPanel } from "@/components/admin/FuelMaterialConsumptionPanel";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Analyse consommation & location matériel",
  robots: { index: false, follow: false },
};

export default async function AdminFuelConsommationPage() {
  await requireAdminPage("/admin/fuel/consommation");
  return (
    <AdminShell active="fuel-consommation">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelMaterialConsumptionPanel />
      </Suspense>
    </AdminShell>
  );
}
