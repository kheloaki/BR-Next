import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SavedDevisList } from "@/components/admin/SavedDevisList";

export const metadata: Metadata = {
  title: "Devis sauvegardés",
  description: "Historique des devis générés depuis l'admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DevisSavedPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/devis-saved");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/devis-saved");
  }

  return (
    <AdminShell active="saved">
      <div className="mb-4 flex justify-end">
        <Link href="/admin/devis-builder" className="inline-flex border border-border rounded-md px-4 py-2 text-sm hover:bg-[#f8f8f8]">
          Retour au devis
        </Link>
      </div>
      <SavedDevisList />
    </AdminShell>
  );
}
