import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "DA Gasoil",
  robots: { index: false, follow: false },
};

export default async function AdminFuelDaGasoilPage() {
  await requireAdminPage("/admin/fuel/da-gasoil");
  return (
    <AdminShell active="fuel-da-gasoil">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="da-gasoil" />
      </Suspense>
    </AdminShell>
  );
}
