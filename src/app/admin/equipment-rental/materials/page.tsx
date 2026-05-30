import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { RentalManager } from "@/components/admin/RentalManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Matériel location",
  robots: { index: false, follow: false },
};

export default async function AdminRentalMaterialsPage() {
  await requireAdminPage("/admin/equipment-rental/materials");
  return (
    <AdminShell active="rental-materials">
      <RentalManager view="materials" />
    </AdminShell>
  );
}
