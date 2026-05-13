import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  DOCUMENT_LABELS,
  type DocumentType,
  type QuoteDraft,
} from "@/components/admin/devis-types";
import { ensureAdminUserRow, getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble de l'activité commerciale BARANE INVEST.",
  robots: {
    index: false,
    follow: false,
  },
};

function moneyMad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(value);
}

function computeQuoteTotal(quote: QuoteDraft) {
  const totalHt = (quote.items ?? []).reduce(
    (acc, item) => (item.isNote ? acc : acc + (item.qty ?? 0) * (item.unitPrice ?? 0)),
    0,
  );
  const netHt = Math.max(0, totalHt - (quote.discount ?? 0));
  const vatAmount = (netHt * (quote.vatRate ?? 0)) / 100;
  return Math.max(0, netHt + vatAmount - (quote.deposit ?? 0));
}

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

  let firstName: string | null = null;
  try {
    const user = await currentUser();
    firstName = user?.firstName ?? null;
  } catch {
    firstName = null;
  }

  let devisCount = 0;
  let bonsCount = 0;
  let clientsCount = 0;
  let suppliersCount = 0;
  let productsCount = 0;
  let recent: Array<QuoteDraft & { dbCreatedAt?: string }> = [];
  let monthTotal = 0;
  let monthDocs = 0;

  try {
    await ensureAdminUserRow(userId);
    const supabase = getSupabaseAdminClient();
    const [quotesRes, clientsRes, suppliersRes, productsRes] = await Promise.all([
      supabase
        .from("admin_quotes")
        .select("id, payload, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("admin_customers").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("admin_suppliers").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("admin_products").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const quoteRows = quotesRes.data ?? [];
    const quotes = quoteRows.map((row) => {
      const payload = (row.payload as QuoteDraft) ?? ({} as QuoteDraft);
      return { ...payload, id: row.id, dbCreatedAt: row.created_at as string };
    });
    devisCount = quotes.filter((q) => (q.documentType ?? "devis") === "devis").length;
    bonsCount = quotes.filter((q) => q.documentType === "bon_commande").length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    monthDocs = quotes.filter((q) => {
      const ts = new Date(q.dbCreatedAt ?? q.createdAt ?? 0).getTime();
      return ts >= startOfMonth.getTime();
    }).length;
    monthTotal = quotes
      .filter((q) => new Date(q.dbCreatedAt ?? q.createdAt ?? 0) >= startOfMonth)
      .reduce((acc, q) => acc + computeQuoteTotal(q), 0);

    recent = quotes.slice(0, 5);
    clientsCount = clientsRes.count ?? 0;
    suppliersCount = suppliersRes.count ?? 0;
    productsCount = productsRes.count ?? 0;
  } catch {
    // If anything fails (e.g. missing env), we keep zero counts and render the dashboard anyway
  }

  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  return (
    <AdminShell active="dashboard">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-[#fafafa] px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
            BARANE INVEST · Espace administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--navy)]">{greeting}</h1>
          <p className="mt-1 text-sm text-[var(--graphite)]/80">
            Suivez votre activité commerciale, créez vos documents et tenez vos carnets à jour.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/devis-builder"
            className="inline-flex items-center rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            + Nouveau devis
          </Link>
          <Link
            href="/admin/devis-saved"
            className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm hover:bg-[#f7f7f7]"
          >
            Voir les documents
          </Link>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Devis créés" value={String(devisCount)} hint="Tous documents confondus" href="/admin/devis-saved" />
        <KpiCard label="Bons de commande" value={String(bonsCount)} hint="Achats fournisseurs" href="/admin/devis-saved" />
        <KpiCard label="Clients enregistrés" value={String(clientsCount)} hint="Carnet client" href="/admin/customers" />
        <KpiCard label="Fournisseurs" value={String(suppliersCount)} hint="Carnet fournisseur" href="/admin/suppliers" />
      </div>

      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-white p-5 lg:col-span-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
                Activité du mois en cours
              </p>
              <p className="mt-1 text-3xl font-semibold text-[var(--navy)]">
                {moneyMad(monthTotal)}
              </p>
              <p className="mt-1 text-sm text-[var(--graphite)]/80">
                {monthDocs} document{monthDocs > 1 ? "s" : ""} émis ce mois-ci (TTC, hors acompte).
              </p>
            </div>
            <Link
              href="/admin/devis-builder"
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs hover:bg-[#f7f7f7]"
            >
              Émettre un document
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">Catalogue</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--navy)]">{productsCount}</p>
          <p className="mt-1 text-sm text-[var(--graphite)]/80">
            Produits enregistrés et réutilisables sur vos documents.
          </p>
          <Link
            href="/admin/products"
            className="mt-3 inline-flex rounded-md border border-border bg-white px-3 py-1.5 text-xs hover:bg-[#f7f7f7]"
          >
            Gérer le catalogue
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--navy)]">Derniers documents</h2>
          <Link
            href="/admin/devis-saved"
            className="text-sm underline underline-offset-4 text-[var(--navy)]"
          >
            Voir tous
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {recent.length === 0 ? (
            <p className="rounded-md border border-border bg-[#fbfbfb] p-4 text-sm text-[var(--graphite)]/80">
              Aucun document encore. Cliquez sur <strong>+ Nouveau devis</strong> pour commencer.
            </p>
          ) : (
            recent.map((quote) => {
              const docType: DocumentType = quote.documentType ?? "devis";
              return (
                <div
                  key={quote.id}
                  className="rounded-md border border-border bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                          docType === "bon_commande"
                            ? "bg-[#eef3fb] text-[var(--navy)]"
                            : "bg-[#fff4e8] text-[#b04a09]"
                        }`}
                      >
                        {DOCUMENT_LABELS[docType]}
                      </span>
                      <p className="font-medium text-[var(--navy)]">
                        N° {quote.quoteNumber || "—"} · {quote.clientName || "Sans nom"}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--graphite)]/70">
                      {new Date(quote.dbCreatedAt ?? quote.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {moneyMad(computeQuoteTotal(quote))}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/devis-builder?id=${encodeURIComponent(quote.id)}`}
                      className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-[#f7f7f7]"
                    >
                      Modifier
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Raccourcis</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <ShortcutCard
            href="/admin/devis-builder"
            title="Nouveau devis"
            description="Préparer un devis client à envoyer."
          />
          <ShortcutCard
            href="/admin/devis-builder"
            title="Nouveau bon de commande"
            description="Passer une commande à un fournisseur."
          />
          <ShortcutCard
            href="/admin/customers"
            title="Carnet clients"
            description="Ajouter, modifier ou supprimer un client."
          />
          <ShortcutCard
            href="/admin/suppliers"
            title="Carnet fournisseurs"
            description="Gérer la liste de vos fournisseurs."
          />
          <ShortcutCard
            href="/admin/products"
            title="Catalogue produits"
            description="Tenez à jour les articles réutilisables."
          />
          <ShortcutCard
            href="/admin/devis-saved"
            title="Documents enregistrés"
            description="Retrouver, modifier ou télécharger un document."
          />
        </div>
      </div>
    </AdminShell>
  );
}

function KpiCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-white p-5 hover:border-[var(--gold)]/55 transition"
    >
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--navy)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--graphite)]/70">{hint}</p>
    </Link>
  );
}

function ShortcutCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-white p-4 hover:bg-[#fafafa] transition block"
    >
      <p className="font-medium text-[var(--navy)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--graphite)]/80">{description}</p>
    </Link>
  );
}
