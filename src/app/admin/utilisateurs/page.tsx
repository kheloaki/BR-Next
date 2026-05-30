import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrganizationMembersManager } from "@/components/admin/OrganizationMembersManager";

export const metadata: Metadata = {
  title: "Utilisateurs",
  description: "Gestion des membres de l'espace admin BARANE INVEST.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminUtilisateursPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/utilisateurs");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/utilisateurs");
  }

  return (
    <AdminShell active="utilisateurs">
      <OrganizationMembersManager />
    </AdminShell>
  );
}
