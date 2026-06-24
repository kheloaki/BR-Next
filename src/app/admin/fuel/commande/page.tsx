import { redirect } from "next/navigation";
import { traitementsHref } from "@/lib/admin/traitement-nav";

/** BC gasoil — via Traitement achat (flux DA → traitement → BC / BL). */
export default function AdminFuelCommandeRedirectPage() {
  redirect(traitementsHref({ type: "achat" }));
}
