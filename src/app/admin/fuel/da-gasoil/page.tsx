import { redirect } from "next/navigation";

/** Legacy route — DA gasoil lives under Demandes d'achat. */
export default function AdminFuelDaGasoilRedirectPage() {
  redirect("/admin/purchase-requests?new=gasoil");
}
