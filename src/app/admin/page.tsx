import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Drill,
  Factory,
  FileText,
  Fuel,
  HardHat,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Pickaxe,
  Receipt,
  Share2,
  ShoppingCart,
  Truck,
  Upload,
  Users,
  Wallet,
  Warehouse,
  Wrench,
} from "lucide-react";
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
import { canAccessFinance } from "@/lib/admin/finance-permissions";
import { financeFacturesHref } from "@/lib/admin/finance-nav";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import {
  facturationDocumentsPath,
  facturationEditPath,
} from "@/lib/admin/facturation-nav";
import {
  btnPrimary,
  btnSecondary,
  btnSecondarySm,
  card,
  linkAccent,
  pageEyebrow,
  pageSubtitle,
  pageTitle,
} from "@/components/admin/admin-form-styles";
import {
  AdminActivityChart,
  AdminAttentionList,
  AdminCommercialBreakdown,
  AdminFinanceLockedCard,
  AdminHeroKpi,
  AdminInitCard,
  AdminMetricCard,
  AdminStatusPill,
  AdminToolbarPill,
} from "@/components/admin/ui/admin-dashboard";
import { AdminDismissibleSection } from "@/components/admin/ui/AdminDismissibleSection";
import { formatDateFr } from "@/lib/admin/date-time-fr";

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble de l'activité BARANE INVEST — chantiers, commercial et opérations.",
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
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value)} L`;
}

function tonnageFr(value: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 1 }).format(value)} t`;
}

function metersFr(value: number) {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(value)} m`;
}

function monthLabelFr() {
  return new Intl.DateTimeFormat("fr-MA", { month: "long", year: "numeric" }).format(new Date());
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
    monthBcTtc: 0,
    monthBlTtc: 0,
  },
  operations: {
    projectsCount: 0,
    activeProjectsCount: 0,
    stockItems: 0,
    stockAlerts: 0,
    pendingPurchaseRequests: 0,
    fuelLitresMonth: 0,
    fuelLitresTotal: 0,
    gasoilStockLitres: 0,
    gasoilMinLitres: 0,
    gasoilStockStatus: "ok",
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
  activity: { weeks: [] },
  finance: null,
  attentionCount: 0,
  recentDocuments: [],
};

function buildAttentionItems(o: DashboardStats["operations"], finance: DashboardStats["finance"]) {
  const items: { label: string; href: string; count?: number }[] = [];
  if (o.stockAlerts > 0) {
    items.push({
      count: o.stockAlerts,
      label: `alerte${o.stockAlerts > 1 ? "s" : ""} stock — réapprovisionner`,
      href: "/admin/stock",
    });
  }
  if (o.pendingPurchaseRequests > 0) {
    items.push({
      count: o.pendingPurchaseRequests,
      label: `demande${o.pendingPurchaseRequests > 1 ? "s" : ""} d'achat en attente`,
      href: "/admin/purchase-requests",
    });
  }
  if (o.traitementsOpen > 0) {
    items.push({
      count: o.traitementsOpen,
      label: `traitement${o.traitementsOpen > 1 ? "s" : ""} achat/vente en cours`,
      href: "/admin/traitements",
    });
  }
  if (o.gasoilStockStatus !== "ok") {
    items.push({
      label:
        o.gasoilStockStatus === "out"
          ? "Stock gasoil épuisé — réapprovisionner la citerne"
          : `Stock gasoil bas (${litresFr(o.gasoilStockLitres)} / seuil ${litresFr(o.gasoilMinLitres)})`,
      href: "/admin/fuel/stock",
    });
  }
  if (finance && finance.overdueCount > 0) {
    items.push({
      count: finance.overdueCount,
      label: `facture${finance.overdueCount > 1 ? "s" : ""} en retard de paiement`,
      href: "/admin/finance/factures",
    });
  }
  return items;
}

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
  let canFinance = false;
  try {
    await ensureAdminUserRow(userId);
    const org = await resolveAdminOrganizationForUser(userId);
    canFinance = canAccessFinance(org.role);
    stats = await getDashboardStats(org.organizationId, { includeFinance: canFinance });
  } catch {
    // Render empty dashboard if DB unavailable
  }

  const { commercial: c, operations: o, activity, finance, attentionCount, recentDocuments: recent } = stats;
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";
  const attentionItems = buildAttentionItems(o, finance);
  const monthName = monthLabelFr();

  const gasoilSub =
    o.gasoilStockLitres > 0
      ? `Citerne ${litresFr(o.gasoilStockLitres)}${o.gasoilStockStatus !== "ok" ? " · bas" : ""}`
      : "Consommation sorties ce mois";

  return (
    <AdminShell active="dashboard">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className={pageEyebrow}>BARANE INVEST · Tableau de bord</p>
          <h1 className={`mt-1 ${pageTitle}`}>{greeting}</h1>
          <p className={pageSubtitle}>
            {monthName} — {o.activeProjectsCount} chantier{o.activeProjectsCount !== 1 ? "s" : ""} actif
            {o.activeProjectsCount !== 1 ? "s" : ""}, {c.monthDocsCount} document{c.monthDocsCount !== 1 ? "s" : ""}{" "}
            commercial{c.monthDocsCount !== 1 ? "ux" : ""}, {moneyMad(c.monthFacturesTtc)} facturé.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={facturationDocumentsPath()} className={btnPrimary}>
            <Upload className="h-4 w-4" aria-hidden />
            Documents enregistrés
          </Link>
          <Link href="/admin/projets" className={btnSecondary}>
            <Share2 className="h-4 w-4" aria-hidden />
            Chantiers
          </Link>
          <Link href="/admin/devis-builder" className={btnSecondary}>
            Nouveau document
          </Link>
        </div>
      </div>

      {financeParam === "forbidden" && (
        <div className="mb-5 rounded-[var(--admin-radius-lg)] border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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

      {attentionItems.length > 0 ? (
        <div className="mb-6">
          <AdminAttentionList items={attentionItems} />
        </div>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]">Indicateurs clés</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminHeroKpi
            href={facturationDocumentsPath("facture")}
            label="Facturation"
            value={moneyMad(c.monthFacturesTtc)}
            sub={`${c.factureCount} facture${c.factureCount !== 1 ? "s" : ""} · ${c.monthDocsCount} doc. ce mois`}
            tone="amber"
            variant="success"
          />
          <AdminHeroKpi
            href="/admin/projets"
            label="Chantiers"
            value={`${o.activeProjectsCount} / ${o.projectsCount}`}
            sub={`${o.activeProjectsCount} actif${o.activeProjectsCount !== 1 ? "s" : ""} sur ${o.projectsCount} projet${o.projectsCount !== 1 ? "s" : ""}`}
            tone="emerald"
            progress={o.projectsCount > 0 ? Math.round((o.activeProjectsCount / o.projectsCount) * 100) : undefined}
          />
          <AdminHeroKpi
            href="/admin/production"
            label="Production"
            value={o.productionTonnageMonth > 0 ? tonnageFr(o.productionTonnageMonth) : "—"}
            sub={
              o.productionTargetMonth > 0
                ? `Objectif ${tonnageFr(o.productionTargetMonth)} · ${o.productionRate ?? 0}% atteint`
                : "Saisie production du mois"
            }
            tone="blue"
            progress={o.productionRate ?? undefined}
          />
          <AdminHeroKpi
            href={attentionItems[0]?.href ?? "/admin/stock"}
            label="À traiter"
            value={String(attentionCount)}
            sub={
              attentionCount > 0
                ? "Stock · DA · traitements · gasoil"
                : "Aucune alerte opérationnelle"
            }
            tone="orange"
            variant={attentionCount > 0 ? "warning" : "success"}
          />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--navy)]">Finance & trésorerie</h2>
          {canFinance ? (
            <Link href="/admin/finance/tresorerie" className={linkAccent}>
              Ouvrir la trésorerie
            </Link>
          ) : null}
        </div>
        {canFinance && finance ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminHeroKpi
                href="/admin/finance/tresorerie"
                label="Trésorerie totale"
                value={moneyMad(finance.totalTreasury)}
                sub={`Caisse ${moneyMad(finance.totalCash)} · Banque ${moneyMad(finance.totalBank)}`}
                tone="emerald"
                variant="success"
              />
              <AdminHeroKpi
                href="/admin/finance/caisse"
                label="Encaissements"
                value={moneyMad(finance.monthIncome)}
                sub={`Entrées caisse/banque — ${monthName}`}
                tone="blue"
              />
              <AdminHeroKpi
                href="/admin/finance/depenses"
                label="Décaissements"
                value={moneyMad(finance.monthExpense)}
                sub={`Sorties caisse/banque — ${monthName}`}
                tone="orange"
              />
              <AdminHeroKpi
                href="/admin/finance/factures"
                label="Créances clients"
                value={moneyMad(finance.clientReceivables)}
                sub={`${finance.openClientInvoices} facture${finance.openClientInvoices !== 1 ? "s" : ""} à encaisser`}
                tone="amber"
                variant={finance.clientReceivables > 0 ? "warning" : "success"}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard
                label="Solde caisse"
                value={moneyMad(finance.totalCash)}
                sub={`${finance.accountCount} compte${finance.accountCount !== 1 ? "s" : ""} actif${finance.accountCount !== 1 ? "s" : ""}`}
                href="/admin/finance/caisse"
                icon={Wallet}
                tone="emerald"
              />
              <AdminMetricCard
                label="Solde banque"
                value={moneyMad(finance.totalBank)}
                sub="Comptes bancaires"
                href="/admin/finance/banque"
                icon={Landmark}
                tone="blue"
              />
              <AdminMetricCard
                label="Dettes fournisseurs"
                value={moneyMad(finance.supplierPayables)}
                sub="Factures fournisseur à payer"
                href={financeFacturesHref({ tab: "fournisseurs" })}
                icon={ArrowUpRight}
                tone="violet"
                alert={finance.supplierPayables > 0}
              />
              <AdminMetricCard
                label="Résultat net"
                value={moneyMad(finance.monthNet)}
                sub={`Encaissements − décaissements (${monthName})`}
                href="/admin/finance/etats"
                icon={finance.monthNet >= 0 ? ArrowDownLeft : ArrowUpRight}
                tone={finance.monthNet >= 0 ? "emerald" : "rose"}
              />
            </div>
            {finance.accountCount === 0 ? (
              <p className="mt-3 text-sm text-[var(--graphite)]">
                Aucun compte caisse/banque configuré.{" "}
                <Link href="/admin/finance/caisse" className="font-medium text-[var(--admin-accent)] hover:underline">
                  Créer un compte
                </Link>{" "}
                pour activer le suivi de trésorerie.
              </p>
            ) : null}
          </>
        ) : canFinance && !finance ? (
          <p className={`${card} px-4 py-6 text-sm text-[var(--graphite)]`}>
            Module finance indisponible (tables non initialisées). Exécutez les scripts SQL finance ou contactez
            l&apos;administrateur.
          </p>
        ) : (
          <AdminFinanceLockedCard />
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--navy)]">Chantiers & terrain</h2>
          <Link href="/admin/etats" className={linkAccent}>
            États ERP
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Forage"
            value={o.drillingMetersMonth > 0 ? metersFr(o.drillingMetersMonth) : "—"}
            sub="Mètres forés ce mois"
            href="/admin/drilling"
            icon={Drill}
            tone="violet"
          />
          <AdminMetricCard
            label="Gasoil distribué"
            value={litresFr(o.fuelLitresMonth)}
            sub={gasoilSub}
            href="/admin/fuel/bons"
            icon={Fuel}
            tone="pink"
            alert={o.gasoilStockStatus !== "ok"}
            progress={
              o.gasoilMinLitres > 0
                ? Math.min(100, Math.round((o.gasoilStockLitres / o.gasoilMinLitres) * 100))
                : undefined
            }
          />
          <AdminMetricCard
            label="Location matériel"
            value={moneyMad(o.rentalMadMonth)}
            sub={`${o.rentalBonsMonth} bon${o.rentalBonsMonth !== 1 ? "s" : ""} ce mois`}
            href="/admin/equipment-rental/bons"
            icon={Wrench}
            tone="orange"
          />
          <AdminMetricCard
            label="Logistique"
            value={String(o.tripsMonth)}
            sub="Voyages / transports ce mois"
            href="/admin/logistics"
            icon={Truck}
            tone="slate"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-[var(--navy)]">Achats, stock & suivi</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Stock articles"
            value={String(o.stockItems)}
            sub={o.stockAlerts > 0 ? `${o.stockAlerts} alerte(s) seuil` : "Hors gasoil (citerne)"}
            href="/admin/stock"
            icon={Warehouse}
            tone="blue"
            alert={o.stockAlerts > 0}
          />
          <AdminMetricCard
            label="Demandes d'achat"
            value={String(o.pendingPurchaseRequests)}
            sub="DA en attente de validation"
            href="/admin/purchase-requests"
            icon={ShoppingCart}
            tone="amber"
            alert={o.pendingPurchaseRequests > 0}
          />
          <AdminMetricCard
            label="Traitements"
            value={String(o.traitementsOpen)}
            sub="Flux achat / vente en cours"
            href="/admin/traitements"
            icon={ClipboardList}
            tone="violet"
            alert={o.traitementsOpen > 0}
          />
          <AdminMetricCard
            label="Pièces d'usure"
            value={o.partsUsageQtyMonth > 0 ? String(o.partsUsageQtyMonth) : "—"}
            sub="Quantité consommée ce mois"
            href="/admin/parts"
            icon={Pickaxe}
            tone="emerald"
          />
        </div>
      </section>

      <AdminDismissibleSection title="Facturation commerciale">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminInitCard
            href={facturationDocumentsPath("devis")}
            title="Devis"
            description="Offres et propositions clients"
            badge={String(c.devisCount)}
            icon={FileText}
            tone="blue"
          />
          <AdminInitCard
            href={facturationDocumentsPath("bon_commande")}
            title="Bons de commande"
            description="Achats fournisseurs"
            badge={String(c.bcCount)}
            icon={ShoppingCart}
            tone="emerald"
          />
          <AdminInitCard
            href={facturationDocumentsPath("bon_livraison")}
            title="Bons de livraison"
            description="Expéditions et réceptions"
            badge={String(c.blCount)}
            icon={Truck}
            tone="violet"
          />
          <AdminInitCard
            href={facturationDocumentsPath("facture")}
            title="Factures"
            description="Facturation clients"
            badge={String(c.factureCount)}
            icon={Receipt}
            tone="amber"
          />
        </div>
        <AdminCommercialBreakdown
          items={[
            { label: "Devis", count: c.devisCount, amount: moneyMad(c.monthDevisTtc), tone: "blue" },
            { label: "BC", count: c.bcCount, amount: moneyMad(c.monthBcTtc), tone: "emerald" },
            { label: "BL", count: c.blCount, amount: moneyMad(c.monthBlTtc), tone: "violet" },
            { label: "Factures", count: c.factureCount, amount: moneyMad(c.monthFacturesTtc), tone: "amber" },
          ]}
        />
      </AdminDismissibleSection>

      <div className="mt-8 grid gap-3 lg:grid-cols-5">
        <div className={`${card} overflow-hidden lg:col-span-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--navy)]">Activité commerciale — {monthName}</h2>
            <Link href={facturationDocumentsPath()} className={linkAccent}>
              Tous les documents
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-[var(--muted)]/30 px-4 py-2">
            <AdminToolbarPill>Mois en cours</AdminToolbarPill>
            <AdminToolbarPill>{o.activeProjectsCount} chantier{o.activeProjectsCount !== 1 ? "s" : ""} actif{o.activeProjectsCount !== 1 ? "s" : ""}</AdminToolbarPill>
            <span className="ms-auto">
              <AdminStatusPill variant={attentionCount > 0 ? "warning" : "success"} label={attentionCount > 0 ? `${attentionCount} alerte${attentionCount > 1 ? "s" : ""}` : "Opérationnel"} />
            </span>
          </div>
          <div className="p-4">
            <p className="text-3xl font-semibold tracking-tight text-[var(--navy)]">{moneyMad(c.monthTotalTtc)}</p>
            <p className="mt-1 text-sm text-[var(--graphite)]">
              Total TTC documents créés ce mois · {c.monthDocsCount} pièce{c.monthDocsCount !== 1 ? "s" : ""}
            </p>
            {activity.weeks.length > 0 ? (
              <AdminActivityChart weeks={activity.weeks} />
            ) : (
              <p className="mt-6 rounded-[var(--admin-radius-md)] border border-dashed border-border px-4 py-8 text-center text-sm text-[var(--graphite)]">
                Aucune activité commerciale enregistrée ce mois.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-[var(--muted)]/20 px-4 py-3">
            <div>
              <p className="text-xs text-[var(--graphite)]">Catalogue produits</p>
              <p className="text-sm font-semibold text-[var(--navy)]">{c.productsCount} références réutilisables</p>
            </div>
            <Link href="/admin/products" className={btnSecondarySm}>
              Gérer le catalogue
            </Link>
          </div>
        </div>

        <div className={`${card} overflow-hidden lg:col-span-2`}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--navy)]">Derniers documents</h2>
            <Link href={facturationDocumentsPath()} className={linkAccent}>
              Voir tous
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--graphite)]">
              Aucun document encore. Créez un devis, BC, BL ou facture depuis{" "}
              <Link href={facturationDocumentsPath()} className="font-medium text-[var(--admin-accent)] hover:underline">
                Documents enregistrés
              </Link>
              .
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium text-[var(--graphite)]">
                  <th className="px-4 py-2 font-medium">Document</th>
                  <th className="px-2 py-2 font-medium">Montant</th>
                  <th className="px-4 py-2 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((quote) => {
                  const docType: DocumentType = quote.documentType ?? "devis";
                  const ttc = computeQuoteTotals(quote).ttc;
                  const created = quote.dbCreatedAt ?? quote.createdAt;
                  return (
                    <tr key={quote.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <Link href={facturationEditPath(quote)} className="flex items-center gap-2 hover:opacity-80">
                          <DocTypeIcon type={docType} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[var(--navy)]">
                              N° {quote.quoteNumber || "—"}
                            </p>
                            <p className="truncate text-[11px] text-[var(--graphite)]">{quote.clientName || "Sans nom"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-xs tabular-nums text-[var(--navy)]">{moneyMad(ttc)}</td>
                      <td className="px-4 py-2.5 text-right text-[11px] text-[var(--graphite)]">
                        {created ? formatDateFr(created) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="border-t border-border px-4 py-3">
            <Link href={facturationDocumentsPath()} className={btnSecondarySm}>
              Nouveau document
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-[var(--navy)]">Référentiels</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard label="Clients" value={String(c.clientsCount)} sub="Carnet client" href="/admin/customers" icon={Users} tone="blue" />
          <AdminMetricCard label="Fournisseurs" value={String(c.suppliersCount)} sub="Carnet fournisseur" href="/admin/suppliers" icon={Package} tone="violet" />
          <AdminMetricCard label="Collaborateurs" value={String(o.employeesCount)} sub="Registre personnel" href="/admin/personnel" icon={Users} tone="emerald" />
          <AdminMetricCard label="Chantiers" value={String(o.projectsCount)} sub={`${o.activeProjectsCount} en cours`} href="/admin/projets" icon={HardHat} tone="orange" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-[var(--navy)]">Accès rapide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminInitCard href="/admin/projets" title="Fiches chantiers" description="KPIs, coûts et exports par projet." icon={HardHat} tone="blue" />
          <AdminInitCard href="/admin/etats" title="États ERP" description="Rapports Sage par chantier et période." icon={Factory} tone="emerald" />
          <AdminInitCard href="/admin/traitements" title="Traitements" description="Flux achat et vente intégrés." icon={ClipboardList} tone="violet" />
          <AdminInitCard href="/admin/fuel/stock" title="Carburant" description="Stock citerne et bons de sortie." icon={Fuel} tone="pink" />
        </div>
      </section>
    </AdminShell>
  );
}

function DocTypeIcon({ type }: { type: DocumentType }) {
  return (
    <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${DOCUMENT_BADGE_CLASS[type]}`}>
      {DOCUMENT_LABELS[type].slice(0, 3)}
    </span>
  );
}
