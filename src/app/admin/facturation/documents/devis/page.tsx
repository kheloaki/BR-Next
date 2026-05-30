import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function FacturationDocumentsDevisLegacyPage() {
  await requireAdminPage("/admin/facturation/documents/devis");
  redirect("/admin/facturation/documents?filter=devis");
}
