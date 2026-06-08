import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomersManager } from "@/components/admin/CustomersManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Clients",
  description: "Gestion des clients pour le devis builder.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCustomersPage() {
  await requireAdminPage("/admin/customers");

  return (
    <AdminShell active="customers">
      <CustomersManager />
    </AdminShell>
  );
}
