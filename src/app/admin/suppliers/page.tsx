import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SuppliersManager } from "@/components/admin/SuppliersManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Fournisseurs",
  description: "Gestion des fournisseurs pour les bons de commande.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSuppliersPage() {
  await requireAdminPage("/admin/suppliers");

  return (
    <AdminShell active="suppliers">
      <SuppliersManager />
    </AdminShell>
  );
}
