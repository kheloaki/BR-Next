import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { QuoteBuilder } from "@/components/admin/QuoteBuilder";

export const metadata: Metadata = {
  title: "Creation de devis",
  description: "Créer, sauvegarder et télécharger des devis depuis l'espace admin.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DevisBuilderPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin/devis-builder");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/devis-builder");
  }

  return (
    <AdminShell active="builder">
      <div className="mb-4 flex justify-end">
        <Link href="/admin" className="inline-flex border border-border rounded-md px-4 py-2 text-sm hover:bg-[#f8f8f8]">
          Retour a l'accueil admin
        </Link>
      </div>
      <Suspense fallback={<div className="rounded-md border border-border bg-white p-6 text-sm text-[var(--graphite)]/70">Chargement…</div>}>
        <QuoteBuilder />
      </Suspense>
    </AdminShell>
  );
}
