import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Legacy route — saisie remplacée par les bons gasoil (achat / sortie). */
export default async function AdminFuelSaisiePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireAdminPage("/admin/fuel/saisie");
  const { project } = await searchParams;
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  redirect(`/admin/fuel/bons${qs}`);
}
