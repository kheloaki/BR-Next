"use client";

import { useEffect, useState } from "react";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  defaultTemplate,
  type DevisTemplate,
  type QuoteDraft,
} from "@/components/admin/devis-types";

export function SavedDevisList() {
  const [quotes, setQuotes] = useState<QuoteDraft[]>([]);
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);

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

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-6 lg:p-8">
      <div className="border-b border-border pb-3">
        <h2 className="text-2xl font-semibold text-[var(--navy)]">Devis sauvegardés</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--graphite)]/80">
        Téléchargez à tout moment les devis déjà enregistrés.
      </p>
      <div className="mt-5 space-y-3">
        {quotes.length === 0 ? (
          <p className="text-sm text-[var(--graphite)]/70 rounded-md border border-border bg-white p-3">
            Aucun devis sauvegardé.
          </p>
        ) : (
          quotes.map((quote) => (
            <div key={quote.id} className="rounded-md border border-border bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-medium text-[var(--navy)]">
                  Devis #{quote.quoteNumber} - {quote.clientName}
                </p>
                <p className="text-xs text-[var(--graphite)]/70">
                  {new Date(quote.createdAt).toLocaleString()} | {quote.items.length} ligne(s)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadDevisPdf(quote, template)}
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
          ))
        )}
      </div>
    </div>
  );
}
