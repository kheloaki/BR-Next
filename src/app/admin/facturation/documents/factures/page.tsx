import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function FacturationDocumentsFacturesLegacyPage() {
  await requireAdminPage("/admin/facturation/documents/factures");
  redirect("/admin/facturation/documents?filter=facture");
}
