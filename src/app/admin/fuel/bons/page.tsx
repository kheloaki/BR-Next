import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { FuelBonsPageSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Bons de sortie gasoil",
  robots: { index: false, follow: false },
};

export default async function AdminFuelBonsPage() {
  await requireAdminPage("/admin/fuel/bons");
  return (
    <AdminShell active="fuel-bons">
      <Suspense fallback={<FuelBonsPageSkeleton />}>
        <FuelManager view="bons" />
      </Suspense>
    </AdminShell>
  );
}
