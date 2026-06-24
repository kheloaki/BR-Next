import { redirect } from "next/navigation";

export default function AdminFinanceBanquePage() {
  redirect("/admin/finance/caisse?tab=banque");
}
