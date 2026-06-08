import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Bons de sortie gasoil",
  robots: { index: false, follow: false },
};

export default async function AdminFuelBonsPage() {
  await requireAdminPage("/admin/fuel/bons");
  return (
    <AdminShell active="fuel-bons">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="bons" />
      </Suspense>
    </AdminShell>
  );
}
