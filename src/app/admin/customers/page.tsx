import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomersManager } from "@/components/admin/CustomersManager";

export const metadata: Metadata = {
  title: "Clients",
  description: "Gestion des clients pour le devis builder.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCustomersPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/customers");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/customers");
  }

  return (
    <AdminShell active="customers">
      <CustomersManager />
    </AdminShell>
  );
}
