import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RentalManager } from "@/components/admin/RentalManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Bons location",
  robots: { index: false, follow: false },
};

export default async function AdminRentalBonsPage() {
  await requireAdminPage("/admin/equipment-rental/bons");
  return (
    <AdminShell active="rental-bons">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <RentalManager view="bons" />
      </Suspense>
    </AdminShell>
  );
}
