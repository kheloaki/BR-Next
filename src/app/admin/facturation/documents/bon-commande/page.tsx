import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function FacturationDocumentsBonLegacyPage() {
  await requireAdminPage("/admin/facturation/documents/bon-commande");
  redirect("/admin/facturation/documents?filter=bon_commande");
}
