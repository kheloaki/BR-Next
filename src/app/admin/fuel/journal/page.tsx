import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Journal carburant merged into Stock gasoil */
export default async function AdminFuelJournalRedirectPage() {
  await requireAdminPage("/admin/fuel/stock");
  redirect("/admin/fuel/stock?tab=journal");
}
