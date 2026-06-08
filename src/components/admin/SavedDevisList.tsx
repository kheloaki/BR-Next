"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FacturationNewDocumentButton } from "@/components/admin/FacturationNewDocumentButton";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnSecondary,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminEmptyState } from "@/components/admin/ux/AdminEmptyState";
import { AdminFilterBar } from "@/components/admin/ux/AdminFilterBar";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import {
  DOCUMENT_BADGE_CLASS,
  DOCUMENT_LABELS,
  defaultTemplate,
  type DevisTemplate,
  type DocumentType,
  type QuoteDraft,
} from "@/components/admin/devis-types";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import {
  facturationBonLivraisonFromFacturePath,
  facturationDocumentsPath,
  facturationEditPath,
  parseDocumentsFilterParam,
} from "@/lib/admin/facturation-nav";

type Filter = "all" | DocumentType;

const FILTER_COPY: Record<Filter, { title: string; description: string; empty: string }> = {
  all: {
    title: "Documents enregistrés",
    description: "Retrouvez, modifiez ou exportez vos devis, bons de commande, factures et bons de livraison.",
    empty: "Les documents enregistrés depuis la facturation apparaîtront ici.",
  },
  devis: {
    title: "Devis enregistrés",
    description: "Historique des devis clients sauvegardés.",
    empty: "Aucun devis enregistré pour le moment.",
  },
  bon_commande: {
    title: "Bons de commande",
    description: "Historique des bons de commande fournisseurs.",
    empty: "Aucun bon de commande enregistré.",
  },
  facture: {
    title: "Factures",
    description: "Historique des factures clients.",
    empty: "Aucune facture enregistrée.",
  },
  bon_livraison: {
    title: "Bons de livraison",
    description: "Bons de livraison liés aux factures clients.",
    empty: "Aucun bon de livraison enregistré.",
  },
};

function formatDocDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const tableAction =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-2.5 text-xs font-medium transition whitespace-nowrap";
const tableActionNeutral = `${tableAction} border-border bg-white text-[var(--navy)] hover:bg-[var(--background)]`;
const tableActionPrimary = `${tableAction} border-[var(--gold)] bg-[var(--gold)] text-[var(--navy-deep)] hover:brightness-95`;
const tableActionDanger = `${tableAction} border-red-200/80 bg-white text-red-700 hover:bg-red-50`;

export function SavedDevisList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useAdminToast();
  const filter = parseDocumentsFilterParam(searchParams.get("filter")) as Filter;

  const [quotes, setQuotes] = useState<QuoteDraft[]>([]);
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  function setFilter(next: Filter) {
    router.replace(facturationDocumentsPath(next === "all" ? undefined : next), { scroll: false });
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [quotesRes, templateRes] = await Promise.all([
      fetch("/api/admin/quotes", { cache: "no-store" }),
      fetch("/api/admin/template", { cache: "no-store" }),
    ]);
    if (!quotesRes.ok) {
      setLoadError("Impossible de charger les documents.");
      setQuotes([]);
    } else {
      setQuotes((await quotesRes.json()) as QuoteDraft[]);
    }
    if (templateRes.ok) {
      setTemplate((await templateRes.json()) as DevisTemplate);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onFocus = () => void loadData();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadData]);

  async function registerInFinance(quote: QuoteDraft) {
    const res = await fetch("/api/admin/finance/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register_quote", quoteId: quote.id }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Facture enregistrée en finance.");
  }

  async function removeQuote(quote: QuoteDraft) {
    const label = `N° ${quote.quoteNumber || "—"} · ${quote.clientName || "Sans nom"}`;
    if (!(await confirmDelete(label))) return;
    const res = await fetch(`/api/admin/quotes?id=${encodeURIComponent(quote.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    await loadData();
  }

  const counts = useMemo(() => {
    const devis = quotes.filter((q) => (q.documentType ?? "devis") === "devis").length;
    const bons = quotes.filter((q) => q.documentType === "bon_commande").length;
    const factures = quotes.filter((q) => q.documentType === "facture").length;
    const bonsLivraison = quotes.filter((q) => q.documentType === "bon_livraison").length;
    return { all: quotes.length, devis, bon_commande: bons, facture: factures, bon_livraison: bonsLivraison };
  }, [quotes]);

  const byType = useMemo(() => {
    if (filter === "all") return quotes;
    return quotes.filter((q) => (q.documentType ?? "devis") === filter);
  }, [quotes, filter]);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byType;
    return byType.filter((quote) => {
      const docType = quote.documentType ?? "devis";
      const haystack = [
        DOCUMENT_LABELS[docType],
        quote.quoteNumber,
        quote.clientName,
        quote.reference,
        quote.linkedFactureNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [byType, search]);

  const copy = FILTER_COPY[filter];

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={copy.title}
        description={copy.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => void loadData()}>
              Actualiser
            </button>
            <FacturationNewDocumentButton />
          </div>
        }
      />

      {loadError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</p>
      ) : null}

      <AdminTabs
        active={filter}
        onChange={(id) => setFilter(id as Filter)}
        aria-label="Filtrer les documents"
        tabs={[
          { id: "all", label: "Tous", badge: counts.all },
          { id: "devis", label: "Devis", badge: counts.devis },
          { id: "bon_commande", label: "Bons de commande", badge: counts.bon_commande },
          { id: "facture", label: "Factures", badge: counts.facture },
          { id: "bon_livraison", label: "Bons de livraison", badge: counts.bon_livraison },
        ]}
      />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="N°, client, référence, type…"
      />

      {loading ? (
        <AdminLoading />
      ) : filteredQuotes.length === 0 ? (
        <AdminEmptyState
          title={search.trim() ? "Aucun résultat" : "Aucun document"}
          description={
            search.trim()
              ? "Essayez un autre terme ou effacez la recherche."
              : copy.empty
          }
          action={
            search.trim() ? undefined : (
              <div className="mt-4 flex justify-center">
                <FacturationNewDocumentButton />
              </div>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Type</th>
                <th className={thClass}>N° document</th>
                <th className={thClass}>Client / fournisseur</th>
                <th className={thClass}>Référence</th>
                <th className={thClass}>Date</th>
                <th className={`${thClass} text-right w-16`}>Lignes</th>
                <th className={`${thClass} text-right min-w-[17rem]`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const docType: DocumentType = quote.documentType ?? "devis";
                const docLabel = DOCUMENT_LABELS[docType];
                return (
                  <tr key={quote.id} className={rowHover}>
                    <td className={tdClass}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${DOCUMENT_BADGE_CLASS[docType]}`}
                      >
                        {docLabel}
                      </span>
                    </td>
                    <td className={`${tdClass} font-medium text-[var(--navy)]`}>
                      {quote.quoteNumber || "—"}
                    </td>
                    <td className={tdClass}>{quote.clientName || "—"}</td>
                    <td className={tdClass}>
                      <p>{quote.reference || "—"}</p>
                      {quote.linkedFactureNumber ? (
                        <p className="mt-0.5 text-[11px] text-[var(--graphite)]/65">
                          → Facture N° {quote.linkedFactureNumber}
                        </p>
                      ) : null}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-[var(--graphite)]/80`}>
                      {formatDocDate(quote.createdAt)}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{quote.items.length}</td>
                    <td className={`${tdClass} text-right`}>
                      <div className="inline-flex flex-nowrap items-center justify-end gap-1.5">
                        <Link href={facturationEditPath(quote)} className={tableActionNeutral}>
                          Modifier
                        </Link>
                        {docType === "facture" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void registerInFinance(quote)}
                              className={tableActionNeutral}
                            >
                              Finance
                            </button>
                            <Link
                              href={facturationBonLivraisonFromFacturePath(quote.id)}
                              className={tableActionNeutral}
                            >
                              Bon livr.
                            </Link>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void downloadDevisPdf(quote, template)}
                          className={tableActionPrimary}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeQuote(quote)}
                          className={tableActionDanger}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        </div>
      )}
      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
