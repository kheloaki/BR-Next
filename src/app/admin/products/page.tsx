import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Produits",
  description: "Catalogue articles — référentiel unique pour stock, traitements et facturation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminProductsPage() {
  await requireAdminPage("/admin/products");

  return (
    <AdminShell active="products">
      <Suspense>
        <ProductsManager />
      </Suspense>
    </AdminShell>
  );
}
