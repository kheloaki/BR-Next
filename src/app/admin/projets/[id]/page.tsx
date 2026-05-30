import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectHub } from "@/components/admin/ProjectHub";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Fiche projet",
  robots: { index: false, follow: false },
};

export default async function AdminProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("/admin/projets");
  const { id } = await params;
  return (
    <AdminShell active="projets">
      <ProjectHub projectId={id} />
    </AdminShell>
  );
}
