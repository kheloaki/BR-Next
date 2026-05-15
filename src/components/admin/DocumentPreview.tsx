"use client";

import Image from "next/image";
import logoStacked from "@/assets/barane-logo-stacked.png";
import {
  DOCUMENT_LABELS,
  type DevisTemplate,
  type DocumentType,
  type LineItem,
} from "@/components/admin/devis-types";

function money(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatActivityLine(activity: string) {
  return activity
    .toUpperCase()
    .replace(/\s*-\s*/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
}

type DocumentPreviewProps = {
  documentType: DocumentType;
  quoteNumber: string;
  reference: string;
  date: string;
  clientName: string;
  clientIce: string;
  isPurchaseOrder: boolean;
  counterpartyMode: "saved" | "passager";
  items: LineItem[];
  vatRate: number;
  discount: number;
  deposit: number;
  includeCachet: boolean;
  template: DevisTemplate;
};

export function DocumentPreview({
  documentType,
  quoteNumber,
  reference,
  date,
  clientName,
  clientIce,
  isPurchaseOrder,
  counterpartyMode,
  items,
  vatRate,
  discount,
  deposit,
  includeCachet,
  template,
}: DocumentPreviewProps) {
  const documentLabel = DOCUMENT_LABELS[documentType];
  const totalHt = items.reduce(
    (acc, item) => (item.isNote ? acc : acc + item.qty * item.unitPrice),
    0,
  );
  const netHt = Math.max(0, totalHt - discount);
  const vatAmount = (netHt * vatRate) / 100;
  const totalTtc = netHt + vatAmount;
  const netToPay = Math.max(0, totalTtc - deposit);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="bg-gradient-to-b from-[#fafbfc] to-white px-4 pt-4">
        <div className="flex items-start gap-3">
          <Image
            src={logoStacked}
            alt="BARANE INVEST"
            width={56}
            height={72}
            className="h-14 w-auto shrink-0 object-contain"
            priority
          />
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="w-fit max-w-full rounded-lg border border-slate-200/80 bg-slate-50/90 px-4 py-1.5 text-center">
              <p className="text-lg font-bold uppercase tracking-wide text-[var(--navy)] leading-none">
                {template.sellerName}
              </p>
              <div className="my-1 flex items-center justify-center gap-1.5" aria-hidden>
                <span className="h-px w-7 bg-[var(--gold)]/55" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
                <span className="h-px w-7 bg-[var(--gold)]/55" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--graphite)]/75 leading-tight">
                {formatActivityLine(template.sellerActivity)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 border-b border-[var(--gold)]/40" aria-hidden />
        <div className="mt-3 flex justify-end pb-1">
          <div className="relative max-w-[155px] shrink-0 overflow-hidden rounded-xl border border-[var(--gold)]/40 bg-gradient-to-br from-[#fffbf7] to-[#fff0e0] py-2 pl-4 pr-3 text-left shadow-md">
            <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--gold)]" aria-hidden />
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#b04a09]">
              {isPurchaseOrder ? "Fournisseur" : "Client"}
            </p>
            <p className="mt-1 text-[11px] font-bold leading-tight text-[var(--navy)]">
              {clientName || "—"}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-[var(--graphite)]/85">
              ICE : {clientIce || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="h-8 w-1 rounded-full bg-[#de7a3a]" aria-hidden />
        <div>
          <p className="text-lg font-bold text-[var(--navy)] leading-none">
            {documentLabel}
            {quoteNumber ? ` N° ${quoteNumber}` : ""}
          </p>
          {counterpartyMode === "passager" ? (
            <p className="text-[9px] text-[#b04a09] mt-1 uppercase tracking-wide">
              {isPurchaseOrder ? "Fournisseur" : "Client"} passager
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {[
          { label: "Numéro", value: quoteNumber || "—" },
          { label: "Date", value: date || "—" },
          { label: "Référence", value: reference || "—" },
        ].map((chip) => (
          <div
            key={chip.label}
            className="rounded-md border border-border bg-[#f1f5f9] px-2.5 py-1.5 min-w-[72px]"
          >
            <p className="text-[8px] uppercase tracking-wider text-[var(--graphite)]/60">
              {chip.label}
            </p>
            <p className="text-[11px] font-semibold text-[var(--navy)]">{chip.value}</p>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-3 overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-[44px_1fr_36px_56px] bg-[var(--navy)] text-[9px] font-bold uppercase tracking-wide text-white px-2 py-1.5">
          <span>Réf.</span>
          <span>Désignation</span>
          <span className="text-right">Qté</span>
          <span className="text-right">Montant</span>
        </div>
        <div className="max-h-[140px] overflow-y-auto divide-y divide-border bg-white">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-[var(--graphite)]/60 italic">
              Aucun article
            </p>
          ) : (
            items.map((item, idx) =>
              item.isNote ? (
                <div
                  key={`note-${idx}`}
                  className="flex gap-2 border-l-2 border-[#de7a3a] bg-[#fff8ef] px-2 py-2 text-[10px] italic text-[var(--graphite)]/85"
                >
                  {item.designation || "Note"}
                </div>
              ) : (
                <div
                  key={`row-${idx}`}
                  className={`grid grid-cols-[44px_1fr_36px_56px] gap-1 px-2 py-1.5 text-[10px] ${
                    idx % 2 === 1 ? "bg-[#f9fafb]" : ""
                  }`}
                >
                  <span className="font-semibold text-[var(--navy)] truncate">
                    {item.reference || "—"}
                  </span>
                  <span className="text-[var(--graphite)] truncate">{item.designation}</span>
                  <span className="text-right text-[var(--graphite)]/80">{item.qty}</span>
                  <span className="text-right font-semibold text-[var(--navy)]">
                    {money(item.qty * item.unitPrice)}
                  </span>
                </div>
              ),
            )
          )}
        </div>
      </div>

      <div className="mx-4 mb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <div className="shrink-0 overflow-hidden rounded-md border border-border text-[9px] sm:w-[42%]">
          <div className="grid grid-cols-3 border-b border-border bg-[#f8fafc] font-bold text-[var(--graphite)]/70">
            <span className="px-2 py-1">Base HT</span>
            <span className="px-2 py-1 border-x border-border">Taux</span>
            <span className="px-2 py-1">TVA</span>
          </div>
          <div className="grid grid-cols-3 border-b border-border">
            <span className="px-2 py-1.5 text-[var(--navy)]">{money(netHt)}</span>
            <span className="px-2 py-1.5 border-x border-border text-[var(--graphite)]/80">
              {vatRate} %
            </span>
            <span className="px-2 py-1.5 text-[var(--navy)]">{money(vatAmount)}</span>
          </div>
          <div className="flex justify-between px-2 py-1.5 font-bold text-[var(--navy)]">
            <span>Total TVA</span>
            <span>{money(vatAmount)}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-border text-[9px]">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.1fr] border-b border-border bg-[#f8fafc] font-bold text-[var(--graphite)]/70">
            {["Total HT", "Escompte", "Total TTC", "Acompte"].map((label, i) => (
              <span
                key={label}
                className={`px-1 py-1 text-center ${i > 0 ? "border-l border-border" : ""}`}
              >
                {label}
              </span>
            ))}
            <span className="border-l border-border bg-[var(--navy)] px-1 py-1 text-center text-[var(--gold)]">
              Net à payer
            </span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1.1fr]">
            {[totalHt, discount, totalTtc, deposit].map((value, i) => (
              <span
                key={i}
                className={`px-1 py-1.5 text-center text-[var(--navy)] ${
                  i > 0 ? "border-l border-border" : ""
                }`}
              >
                {money(value)}
              </span>
            ))}
            <span className="border-l border-[var(--navy)] bg-[var(--navy)] px-1 py-1.5 text-center text-sm font-bold text-white">
              {money(netToPay)}
            </span>
          </div>
        </div>
      </div>

      {includeCachet ? (
        <div className="mx-4 mb-3 rounded-md border border-dashed border-[var(--gold)]/50 bg-[#fff8ef] px-3 py-2 text-right">
          <p className="text-[9px] font-medium text-[var(--graphite)]/70">
            Cachet et signature inclus
          </p>
        </div>
      ) : null}

      <div className="border-t border-border bg-[#f8fafc] px-3 py-2 text-center">
        <p className="text-[8px] text-[var(--graphite)]/70 leading-relaxed line-clamp-2">
          {template.sellerAddress}
        </p>
      </div>
    </div>
  );
}

