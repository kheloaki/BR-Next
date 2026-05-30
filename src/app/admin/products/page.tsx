import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const metadata: Metadata = {
  title: "Produits",
  description: "Gestion des produits pour le devis builder.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProductsPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/products");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/products");
  }

  return (
    <AdminShell active="products">
      <div className="mb-4 flex justify-end">
        <Link
          href="/admin/facturation/devis"
          className="inline-flex border border-border rounded-md px-4 py-2 text-sm hover:bg-[#f8f8f8]"
        >
          Retour au devis
        </Link>
      </div>
      <ProductsManager />
    </AdminShell>
  );
}
