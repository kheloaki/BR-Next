import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { FuelManager } from "@/components/admin/FuelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Journal carburant",
  robots: { index: false, follow: false },
};

export default async function AdminFuelJournalPage() {
  await requireAdminPage("/admin/fuel/journal");
  return (
    <AdminShell active="fuel-journal">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <FuelManager view="journal" />
      </Suspense>
    </AdminShell>
  );
}
