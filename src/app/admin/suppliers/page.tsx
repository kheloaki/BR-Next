import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SuppliersManager } from "@/components/admin/SuppliersManager";

export const metadata: Metadata = {
  title: "Fournisseurs",
  description: "Gestion des fournisseurs pour les bons de commande.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSuppliersPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/suppliers");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/suppliers");
  }

  return (
    <AdminShell active="suppliers">
      <div className="mb-4 flex justify-end">
        <Link href="/admin/devis-builder" className="inline-flex border border-border rounded-md px-4 py-2 text-sm hover:bg-[#f8f8f8]">
          Retour au devis
        </Link>
      </div>
      <SuppliersManager />
    </AdminShell>
  );
}
