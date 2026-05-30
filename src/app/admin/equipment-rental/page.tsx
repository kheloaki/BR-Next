import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Redirect legacy /admin/equipment-rental to matériel catalogue */
export default async function AdminEquipmentRentalIndexPage() {
  await requireAdminPage("/admin/equipment-rental");
  redirect("/admin/equipment-rental/materials");
}
