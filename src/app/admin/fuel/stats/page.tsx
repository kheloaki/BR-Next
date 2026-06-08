import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Legacy route — stats par engin intégrées au journal. */
export default async function AdminFuelStatsPage() {
  await requireAdminPage("/admin/fuel/stats");
  redirect("/admin/fuel/consommation");
}
