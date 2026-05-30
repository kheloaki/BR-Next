import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Nouvelle saisie carburant",
  robots: { index: false, follow: false },
};

export default async function AdminFuelSaisiePage() {
  await requireAdminPage("/admin/fuel/saisie");
  return (
    <AdminShell active="fuel-saisie">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="saisie" />
      </Suspense>
    </AdminShell>
  );
}
