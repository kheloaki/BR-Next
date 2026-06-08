import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrganizationMembersManager } from "@/components/admin/OrganizationMembersManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Utilisateurs",
  description: "Gestion des membres de l'espace admin BARANE INVEST.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUtilisateursPage() {
  await requireAdminPage("/admin/utilisateurs");

  return (
    <AdminShell active="utilisateurs">
      <OrganizationMembersManager />
    </AdminShell>
  );
}
