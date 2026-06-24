import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RentalManager } from "@/components/admin/RentalManager";
import { RentalBonsPageSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Bons location",
  robots: { index: false, follow: false },
};

export default async function AdminRentalBonsPage() {
  await requireAdminPage("/admin/equipment-rental/bons");
  return (
    <AdminShell active="rental-bons">
      <Suspense fallback={<RentalBonsPageSkeleton />}>
        <RentalManager view="bons" />
      </Suspense>
    </AdminShell>
  );
}
