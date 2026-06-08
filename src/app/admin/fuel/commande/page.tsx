import { redirect } from "next/navigation";

/** BC gasoil — via Traitement achat (flux DA → traitement → BC / BL). */
export default function AdminFuelCommandeRedirectPage() {
  redirect("/admin/traitements-achat");
}
