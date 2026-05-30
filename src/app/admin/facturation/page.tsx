import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function FacturationIndexPage() {
  await requireAdminPage("/admin/facturation");
  redirect("/admin/facturation/devis");
}
