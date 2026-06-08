import type { QuoteDraft } from "@/components/admin/devis-types";
import type { StockMovement } from "@/components/admin/operations-types";
import type { RentalContract } from "@/components/admin/operations-types";
import type { Traitement, TraitementLine } from "@/lib/admin/traitement-types";
import type { GasoilBonReport, ProfitabilityLine, QuoteTotals } from "@/lib/admin/project-report-types";
import { DEFAULT_VAT_RATE, htToTtc, roundMoney } from "@/lib/admin/price-ht-ttc";

export function dateInRange(value: string | null | undefined, from?: string, to?: string): boolean {
  if (!value) return !from && !to;
  const d = value.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function computeQuoteTotals(quote: QuoteDraft): QuoteTotals {
  const totalHt = (quote.items ?? []).reduce(
    (acc, item) => (item.isNote ? acc : acc + (item.qty ?? 0) * (item.unitPrice ?? 0)),
    0,
  );
  const netHt = Math.max(0, totalHt - (quote.discount ?? 0));
  const vatAmount = roundMoney((netHt * (quote.vatRate ?? 0)) / 100);
  const ttc = roundMoney(Math.max(0, netHt + vatAmount - (quote.deposit ?? 0)));
  return { ht: roundMoney(netHt), vat: vatAmount, ttc };
}

export function traitementLinesTotal(lines: TraitementLine[]): number {
  return roundMoney(lines.reduce((s, l) => s + l.qty * l.unitPrice, 0));
}

export function sumGasoilSortieLitres(sorties: { litres: number }[]): number {
  return sorties.reduce((a, r) => a + r.litres, 0);
}

export function sumGasoilCost(bons: GasoilBonReport[]): number {
  return roundMoney(
    bons.reduce((a, b) => {
      if (b.totalAmount > 0) return a + b.totalAmount;
      return a + b.litres * b.unitPrice;
    }, 0),
  );
}

export function computeStockTotals(movements: StockMovement[]) {
  let entrees = 0;
  let sorties = 0;
  let valeurHt = 0;
  for (const m of movements) {
    if (m.movementType === "entry") entrees += m.qty;
    else sorties += m.qty;
    if (m.movementType === "exit") valeurHt += m.totalPriceHt;
  }
  return { entrees, sorties, valeurHt: roundMoney(valeurHt), movementCount: movements.length };
}

export function computeRentalTotals(contracts: RentalContract[], vatRate = DEFAULT_VAT_RATE) {
  const ht = roundMoney(contracts.reduce((a, r) => a + r.totalMad, 0));
  const tva = roundMoney(ht * (vatRate / 100));
  const ttc = htToTtc(ht, vatRate);
  return { ht, tva, ttc, entryCount: contracts.length };
}

export function computeFacturationTotals(documents: QuoteDraft[]) {
  let ht = 0;
  let vat = 0;
  let ttc = 0;
  for (const doc of documents) {
    const t = computeQuoteTotals(doc);
    ht += t.ht;
    vat += t.vat;
    ttc += t.ttc;
  }
  return {
    ht: roundMoney(ht),
    vat: roundMoney(vat),
    ttc: roundMoney(ttc),
    entryCount: documents.length,
  };
}

export function computeProfitabilityLines(input: {
  gasoilCost: number;
  rentalHt: number;
  partsCost: number;
  daTotal: number;
  achatsHt: number;
  ventesHt: number;
}): { lines: ProfitabilityLine[]; totals: { costs: number; revenue: number; margin: number; marginPct: number } } {
  const lines: ProfitabilityLine[] = [
    { key: "gasoil", label: "Gasoil", ht: input.gasoilCost, kind: "cost" as const },
    { key: "location", label: "Location matériel", ht: input.rentalHt, kind: "cost" as const },
    { key: "pieces", label: "Pièces & consommables", ht: input.partsCost, kind: "cost" as const },
    { key: "da", label: "Demandes d'achat", ht: input.daTotal, kind: "cost" as const },
    { key: "achats", label: "Traitements achat", ht: input.achatsHt, kind: "cost" as const },
    { key: "ventes", label: "Ventes / facturation", ht: input.ventesHt, kind: "revenue" as const },
  ].filter((l) => l.ht !== 0);

  const costs = roundMoney(
    input.gasoilCost + input.rentalHt + input.partsCost + input.daTotal + input.achatsHt,
  );
  const revenue = roundMoney(input.ventesHt);
  const margin = roundMoney(revenue - costs);
  const marginPct = revenue > 0 ? roundMoney((margin / revenue) * 100) : 0;

  return { lines, totals: { costs, revenue, margin, marginPct } };
}

export function sumTraitementAchats(traitements: Traitement[]): number {
  return roundMoney(
    traitements
      .filter((t) => t.traitementType === "achat")
      .reduce((a, t) => a + traitementLinesTotal(t.lines), 0),
  );
}

export function sumTraitementVentes(traitements: Traitement[]): number {
  return roundMoney(
    traitements
      .filter((t) => t.traitementType === "vente")
      .reduce((a, t) => a + traitementLinesTotal(t.lines), 0),
  );
}
