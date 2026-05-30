import { redirect } from "next/navigation";

/** Legacy URL — engins are managed under Location matériel. */
export default function AdminEnginsRedirectPage() {
  redirect("/admin/equipment-rental/materials");
}
