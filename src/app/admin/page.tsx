import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";
import {
  DOCUMENT_BADGE_CLASS,
  DOCUMENT_LABELS,
  type DocumentType,
} from "@/components/admin/devis-types";
import { resolveAdminOrganizationForUser } from "@/lib/admin/organization";
import { ensureAdminUserRow } from "@/lib/supabase/admin";
import { getDashboardStats, type DashboardStats } from "@/lib/admin/dashboard-stats";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import {
  facturationBuilderPath,
  facturationDocumentsPath,
  facturationEditPath,
} from "@/lib/admin/facturation-nav";
import { btnPrimary, btnSecondary, card } from "@/components/admin/admin-form-styles";

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
    maximumFractionDigits: 0,
  }).format(value);
}

function litresFr(value: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 1 }).format(value)} L`;
}

const EMPTY_STATS: DashboardStats = {
  commercial: {
    devisCount: 0,
    bcCount: 0,
    blCount: 0,
    factureCount: 0,
    clientsCount: 0,
    suppliersCount: 0,
    productsCount: 0,
    monthDocsCount: 0,
    monthTotalTtc: 0,
    monthFacturesTtc: 0,
    monthDevisTtc: 0,
  },
  operations: {
    projectsCount: 0,
    activeProjectsCount: 0,
    stockItems: 0,
    stockAlerts: 0,
    pendingPurchaseRequests: 0,
    fuelLitresMonth: 0,
    fuelLitresTotal: 0,
    productionTonnageMonth: 0,
    productionTargetMonth: 0,
    productionRate: null,
    drillingMetersMonth: 0,
    tripsMonth: 0,
    rentalBonsCount: 0,
    rentalBonsMonth: 0,
    rentalMadMonth: 0,
    traitementsOpen: 0,
    partsUsageQtyMonth: 0,
    employeesCount: 0,
  },
  recentDocuments: [],
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ finance?: string }>;
}) {
  const userId = await requireAdminPage("/admin");
  const { finance: financeParam } = await searchParams;

  let firstName: string | null = null;
  try {
    const user = await currentUser();
    firstName = user?.firstName ?? null;
  } catch {
    firstName = null;
  }

  let stats = EMPTY_STATS;
  try {
    await ensureAdminUserRow(userId);
    const org = await resolveAdminOrganizationForUser(userId);
    stats = await getDashboardStats(org.organizationId);
  } catch {
    // Render empty dashboard if DB unavailable
  }

  const { commercial: c, operations: o, recentDocuments: recent } = stats;
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  return (
    <AdminShell active="dashboard">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3 bg-[var(--background)]/60`}>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">
            BARANE INVEST · Espace administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--navy)]">{greeting}</h1>
          <p className="mt-1 text-sm text-[var(--graphite)]/80">
            Données en direct — {o.activeProjectsCount} chantier{o.activeProjectsCount !== 1 ? "s" : ""} actif
            {o.activeProjectsCount !== 1 ? "s" : ""}
            , {c.monthDocsCount} document{c.monthDocsCount !== 1 ? "s" : ""} ce mois.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={facturationDocumentsPath()} className={btnPrimary}>
            Documents enregistrés
          </Link>
          <Link href="/admin/projets" className={btnSecondary}>
            Chantiers
          </Link>
        </div>
      </div>

      {financeParam === "forbidden" && (
        <div className="mt-4 rounded-md border border-[#f0d4b8] bg-[#fff8f0] px-4 py-3 text-sm text-[#7a3d12]">
          <p className="font-medium">Accès Finance refusé</p>
          <p className="mt-1">
            Votre rôle actuel ne permet pas d&apos;accéder au module Finance. Demandez à un administrateur de vous
            attribuer le rôle <strong>Financier</strong>, <strong>Comptable</strong> ou <strong>Admin</strong> via{" "}
            <Link href="/admin/utilisateurs" className="underline">
              Utilisateurs
            </Link>
            .
          </p>
        </div>
      )}

      {(o.stockAlerts > 0 || o.pendingPurchaseRequests > 0 || o.traitementsOpen > 0) && (
        <div className="mt-4 rounded-md border border-[#f0d4b8] bg-[#fff8f0] px-4 py-3 text-sm text-[#7a3d12] space-y-1">
          {o.stockAlerts > 0 ? (
            <p>
              <strong>{o.stockAlerts}</strong> alerte{o.stockAlerts > 1 ? "s" : ""} stock.{" "}
              <Link href="/admin/stock" className="underline underline-offset-2">
                Voir le stock
              </Link>
            </p>
          ) : null}
          {o.pendingPurchaseRequests > 0 ? (
            <p>
              <strong>{o.pendingPurchaseRequests}</strong> demande{o.pendingPurchaseRequests > 1 ? "s" : ""} d&apos;achat
              en attente.{" "}
              <Link href="/admin/purchase-requests" className="underline underline-offset-2">
                Traiter
              </Link>
            </p>
          ) : null}
          {o.traitementsOpen > 0 ? (
            <p>
              <strong>{o.traitementsOpen}</strong> traitement{o.traitementsOpen > 1 ? "s" : ""} achat/vente en cours.{" "}
              <Link href="/admin/traitements-achat" className="underline underline-offset-2">
                Ouvrir
              </Link>
            </p>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--graphite)]/70">
        Facturation
      </p>
      <div className="mt-2 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Devis" value={String(c.devisCount)} hint="Offres clients" href={facturationDocumentsPath("devis")} />
        <KpiCard
          label="Bons de commande"
          value={String(c.bcCount)}
          hint="Achats fournisseurs"
          href={facturationDocumentsPath("bon_commande")}
        />
        <KpiCard
          label="Bons de livraison"
          value={String(c.blCount)}
          hint="Expéditions / réceptions"
          href={facturationDocumentsPath("bon_livraison")}
        />
        <KpiCard
          label="Factures"
          value={String(c.factureCount)}
          hint="Facturation clients"
          href={facturationDocumentsPath("facture")}
        />
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--graphite)]/70">Opérations</p>
      <div className="mt-2 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Chantiers"
          value={String(o.projectsCount)}
          hint={`${o.activeProjectsCount} actif${o.activeProjectsCount !== 1 ? "s" : ""}`}
          href="/admin/projets"
        />
        <KpiCard
          label="Stock"
          value={String(o.stockItems)}
          hint={o.stockAlerts > 0 ? `${o.stockAlerts} alerte(s)` : "Articles hors gasoil"}
          href="/admin/stock"
        />
        <KpiCard
          label="Gasoil"
          value={litresFr(o.fuelLitresMonth)}
          hint={
            o.fuelLitresMonth !== o.fuelLitresTotal
              ? `${litresFr(o.fuelLitresTotal)} cumulé`
              : "Consommation ce mois"
          }
          href="/admin/fuel/stock?tab=journal"
        />
        <KpiCard
          label="Location matériel"
          value={moneyMad(o.rentalMadMonth)}
          hint={`${o.rentalBonsMonth} bon${o.rentalBonsMonth !== 1 ? "s" : ""} ce mois · ${o.rentalBonsCount} total`}
          href="/admin/equipment-rental/bons"
        />
      </div>

      <div className="mt-3 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Clients" value={String(c.clientsCount)} hint="Carnet client" href="/admin/customers" />
        <KpiCard label="Fournisseurs" value={String(c.suppliersCount)} hint="Carnet fournisseur" href="/admin/suppliers" />
        <KpiCard
          label="Collaborateurs"
          value={String(o.employeesCount)}
          hint="Registre personnel"
          href="/admin/personnel"
        />
        <KpiCard
          label="Traitements"
          value={String(o.traitementsOpen)}
          hint="Achat / vente en cours"
          href="/admin/traitements-achat"
        />
      </div>

      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="rounded-md border border-border bg-white p-5 lg:col-span-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">Activité du mois en cours</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--navy)]">{moneyMad(c.monthTotalTtc)}</p>
              <p className="mt-1 text-sm text-[var(--graphite)]/80">
                {c.monthDocsCount} document{c.monthDocsCount !== 1 ? "s" : ""} · Factures{" "}
                {moneyMad(c.monthFacturesTtc)} · Devis {moneyMad(c.monthDevisTtc)}
              </p>
            </div>
            <Link
              href={facturationDocumentsPath()}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-xs hover:bg-[#f7f7f7]"
            >
              Nouveau document
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">Catalogue</p>
          <p className="mt-1 text-3xl font-semibold text-[var(--navy)]">{c.productsCount}</p>
          <p className="mt-1 text-sm text-[var(--graphite)]/80">Produits réutilisables sur vos documents.</p>
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
          <Link href={facturationDocumentsPath()} className="text-sm underline underline-offset-4 text-[var(--navy)]">
            Voir tous ({c.devisCount + c.bcCount + c.blCount + c.factureCount})
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {recent.length === 0 ? (
            <p className="rounded-md border border-border bg-[#fbfbfb] p-4 text-sm text-[var(--graphite)]/80">
              Aucun document encore. Ouvrez{" "}
              <Link href={facturationDocumentsPath()} className="font-medium underline underline-offset-2">
                Documents enregistrés
              </Link>{" "}
              puis cliquez sur <strong>Nouveau</strong> pour créer un devis, BC, facture ou BL.
            </p>
          ) : (
            recent.map((quote) => {
              const docType: DocumentType = quote.documentType ?? "devis";
              const ttc = computeQuoteTotals(quote).ttc;
              return (
                <div
                  key={quote.id}
                  className="rounded-md border border-border bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${DOCUMENT_BADGE_CLASS[docType]}`}
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
                      · {moneyMad(ttc)} TTC
                    </p>
                  </div>
                  <Link
                    href={facturationEditPath(quote)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-[#f7f7f7] self-start sm:self-center"
                  >
                    Modifier
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-[var(--navy)]">Accès rapide</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <ShortcutCard href="/admin/projets" title="Projets & états" description="Chantiers, KPIs et exports PDF/Excel." />
          <ShortcutCard href="/admin/etats" title="États ERP" description="Rapports Sage par chantier et période." />
          <ShortcutCard href="/admin/traitements-achat" title="Traitements achat" description="BC, BL, factures fournisseurs." />
          <ShortcutCard href="/admin/traitements-vente" title="Traitements vente" description="Devis, BL, factures clients." />
          <ShortcutCard href="/admin/stock" title="Stock" description="Inventaire, mouvements et alertes." />
          <ShortcutCard href="/admin/fuel/stock" title="Carburant" description="Stock gasoil et consommation." />
          <ShortcutCard href="/admin/equipment-rental/bons" title="Location" description="Bons journaliers matériel." />
          <ShortcutCard href="/admin/purchase-requests" title="Demandes d'achat" description="DA et validation achats." />
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
    <Link href={href} className={`${card} block p-5 transition hover:border-[var(--gold)]/55`}>
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--graphite)]/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--navy)] leading-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--graphite)]/70">{hint}</p>
    </Link>
  );
}

function ShortcutCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className={`${card} block p-4 transition hover:bg-[var(--background)]/80`}>
      <p className="font-medium text-[var(--navy)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--graphite)]/80">{description}</p>
    </Link>
  );
}
