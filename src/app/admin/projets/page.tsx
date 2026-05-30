import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectsManager } from "@/components/admin/ProjectsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Projets",
  description: "Gestion des chantiers et projets BARANE INVEST.",
  robots: { index: false, follow: false },
};

export default async function AdminProjetsPage() {
  await requireAdminPage("/admin/projets");
  return (
    <AdminShell active="projets">
      <ProjectsManager />
    </AdminShell>
  );
}
