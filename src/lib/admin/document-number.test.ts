import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { computeNextDocumentNumber } from "@/lib/admin/document-number";

function quote(partial: Partial<QuoteDraft> & Pick<QuoteDraft, "quoteNumber">): QuoteDraft {
  return {
    id: partial.id ?? "q-1",
    createdAt: partial.createdAt ?? "2026-01-01T00:00:00.000Z",
    documentType: partial.documentType ?? "devis",
    clientName: partial.clientName ?? "Client",
    clientIce: "",
    clientAddress: "",
    quoteNumber: partial.quoteNumber,
    reference: "",
    date: partial.date ?? "2026-05-25",
    vatRate: 20,
    discount: 0,
    deposit: 0,
    items: [],
  };
}

describe("computeNextDocumentNumber", () => {
  it("starts at 001 for an empty series", () => {
    assert.equal(computeNextDocumentNumber([], "devis", 2026), "001/2026");
  });

  it("increments by count, not by max sequence", () => {
    const quotes = [
      quote({ id: "1", quoteNumber: "001/2026", date: "2026-05-01" }),
      quote({ id: "2", quoteNumber: "025/2026", date: "2026-05-25" }),
    ];
    assert.equal(computeNextDocumentNumber(quotes, "devis", 2026), "003/2026");
  });

  it("isolates numbering per year", () => {
    const quotes = [
      quote({ id: "1", quoteNumber: "001/2025", date: "2025-12-31", documentType: "facture" }),
      quote({ id: "2", quoteNumber: "002/2025", date: "2025-12-31", documentType: "facture" }),
    ];
    assert.equal(computeNextDocumentNumber(quotes, "facture", 2026), "001/2026");
  });

  it("isolates numbering per document type", () => {
    const quotes = [
      quote({ id: "1", quoteNumber: "001/2026", documentType: "devis" }),
      quote({ id: "2", quoteNumber: "001/2026", documentType: "facture" }),
    ];
    assert.equal(computeNextDocumentNumber(quotes, "devis", 2026), "002/2026");
    assert.equal(computeNextDocumentNumber(quotes, "facture", 2026), "002/2026");
  });
});
