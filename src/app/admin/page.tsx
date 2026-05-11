import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Administration",
  description: "Espace administrateur BARANE INVEST.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  let userId: string | null = null;
  try {
    ({ userId } = await auth());
  } catch {
    redirect("/sign-in?redirect_url=/admin");
  }

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  const serviceStatus = [
    { name: "Clerk Authentication", ok: true, detail: "Connected" },
    {
      name: "Contact Mail (Resend)",
      ok: Boolean(
        process.env.RESEND_API_KEY &&
          process.env.RESEND_FROM_EMAIL &&
          process.env.CONTACT_TO_EMAIL,
      ),
      detail: process.env.RESEND_API_KEY ? "Configured" : "Missing environment variables",
    },
    {
      name: "Supabase administration",
      ok: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
      detail: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Configured"
        : "Missing environment variables",
    },
    {
      name: "R2 Uploads",
      ok: Boolean(
        process.env.R2_ENDPOINT &&
          process.env.R2_ACCESS_KEY_ID &&
          process.env.R2_SECRET_ACCESS_KEY &&
          process.env.R2_BUCKET_NAME,
      ),
      detail: process.env.R2_ENDPOINT ? "Configured" : "Missing environment variables",
    },
  ];

  const healthyCount = serviceStatus.filter((s) => s.ok).length;

  return (
    <AdminShell active="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-md px-4 py-3 bg-[#fafafa]">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--navy)]">Operations admin</h1>
          <p className="text-sm text-[var(--graphite)]/80">
            Centre de pilotage BARANE INVEST pour les integrations et le flux de devis.
          </p>
        </div>
        <Link href="/admin/devis-builder" className="inline-flex rounded-md border border-[#de7a3a] bg-[#de7a3a] text-white px-4 py-2 text-sm hover:opacity-90">
          Creer un devis
        </Link>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
            Integrations actives
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--navy)]">
            {healthyCount}/{serviceStatus.length}
          </p>
        </div>
        <div className="rounded-md border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
            Compte connecte
          </p>
          <p className="mt-2 text-sm text-[var(--navy)] break-all">{userId}</p>
        </div>
        <div className="rounded-md border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
            Niveau d'acces
          </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--navy)]">Authentifie</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Etat du systeme</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {serviceStatus.map((item) => (
            <div key={item.name} className="rounded-md border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-[var(--navy)]">{item.name}</p>
                <span
                  className={`text-xs uppercase tracking-[0.12em] ${
                    item.ok ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {item.ok ? "Pret" : "Verifier config"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--graphite)]/80">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Actions rapides</h2>
        <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-6 gap-3">
          <Link href="/contact" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Page contact</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Verifier le formulaire lead et le flux email.
            </p>
          </Link>
          <Link href="/services" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Page services</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Verifier le contenu de positionnement digital.
            </p>
          </Link>
          <Link href="/sitemap.xml" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Sitemap XML</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Verifier l'indexation et la structure des URLs.
            </p>
          </Link>
          <Link href="/admin/devis-saved" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Devis enregistres</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Consulter, telecharger ou nettoyer les brouillons.
            </p>
          </Link>
          <Link href="/admin/products" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Produits</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Gerer le catalogue produits pour le selecteur devis.
            </p>
          </Link>
          <Link href="/admin/customers" className="rounded-md border border-border p-4 hover:bg-[#fafafa]">
            <p className="font-medium text-[var(--navy)]">Clients</p>
            <p className="mt-2 text-sm text-[var(--graphite)]/80">
              Gerer le repertoire clients pour la selection devis.
            </p>
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
