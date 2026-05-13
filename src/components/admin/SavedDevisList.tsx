"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  DOCUMENT_LABELS,
  defaultTemplate,
  type DevisTemplate,
  type DocumentType,
  type QuoteDraft,
} from "@/components/admin/devis-types";

type Filter = "all" | DocumentType;

export function SavedDevisList() {
  const [quotes, setQuotes] = useState<QuoteDraft[]>([]);
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [quotesRes, templateRes] = await Promise.all([
        fetch("/api/admin/quotes", { cache: "no-store" }),
        fetch("/api/admin/template", { cache: "no-store" }),
      ]);
      if (!mounted) return;
      if (quotesRes.ok) {
        setQuotes((await quotesRes.json()) as QuoteDraft[]);
      }
      if (templateRes.ok) {
        setTemplate((await templateRes.json()) as DevisTemplate);
      }
    }
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  function removeQuote(id: string) {
    void fetch(`/api/admin/quotes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(async (res) => {
      if (!res.ok) return;
      const quotesRes = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (!quotesRes.ok) return;
      setQuotes((await quotesRes.json()) as QuoteDraft[]);
    });
  }

  const counts = useMemo(() => {
    const devis = quotes.filter((q) => (q.documentType ?? "devis") === "devis").length;
    const bons = quotes.filter((q) => q.documentType === "bon_commande").length;
    return { all: quotes.length, devis, bon_commande: bons };
  }, [quotes]);

  const visibleQuotes = useMemo(() => {
    if (filter === "all") return quotes;
    return quotes.filter((q) => (q.documentType ?? "devis") === filter);
  }, [quotes, filter]);

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-6 lg:p-8">
      <div className="border-b border-border pb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--navy)]">Documents sauvegardés</h2>
          <p className="text-sm text-[var(--graphite)]/80 mt-1">
            Téléchargez ou modifiez vos devis et bons de commande à tout moment.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-white p-1 text-sm">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label={`Tous (${counts.all})`} />
          <FilterTab active={filter === "devis"} onClick={() => setFilter("devis")} label={`Devis (${counts.devis})`} />
          <FilterTab
            active={filter === "bon_commande"}
            onClick={() => setFilter("bon_commande")}
            label={`Bons de commande (${counts.bon_commande})`}
          />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {visibleQuotes.length === 0 ? (
          <p className="text-sm text-[var(--graphite)]/70 rounded-md border border-border bg-white p-3">
            Aucun document enregistré dans cette catégorie.
          </p>
        ) : (
          visibleQuotes.map((quote) => {
            const docType: DocumentType = quote.documentType ?? "devis";
            const docLabel = DOCUMENT_LABELS[docType];
            return (
              <div key={quote.id} className="rounded-md border border-border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                        docType === "bon_commande"
                          ? "bg-[#eef3fb] text-[var(--navy)]"
                          : "bg-[#fff4e8] text-[#b04a09]"
                      }`}
                    >
                      {docLabel}
                    </span>
                    <p className="font-medium text-[var(--navy)]">
                      N° {quote.quoteNumber} - {quote.clientName}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--graphite)]/70 mt-1">
                    {new Date(quote.createdAt).toLocaleString()} | {quote.items.length} ligne(s)
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href={`/admin/devis-builder?id=${encodeURIComponent(quote.id)}`}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-[#f7f7f7]"
                  >
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void downloadDevisPdf(quote, template);
                    }}
                    className="rounded-md border border-[#de7a3a] bg-[#de7a3a] px-3 py-2 text-sm text-white hover:opacity-90"
                  >
                    Télécharger PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuote(quote.id)}
                    className="rounded-md border border-border px-3 py-2 text-sm hover:bg-[#f7f7f7]"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm transition ${
        active
          ? "bg-[#de7a3a] text-white"
          : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
      }`}
    >
      {label}
    </button>
  );
}
