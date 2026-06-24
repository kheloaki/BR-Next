import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { QuoteDraft } from "@/components/admin/devis-types";
import type { Traitement } from "@/lib/admin/traitement-types";
import {
  resolveTraitementInvoiceAmounts,
  traitementFinanceDocumentType,
} from "./traitement-finance-sync.ts";

function baseTraitement(overrides: Partial<Traitement> = {}): Traitement {
  return {
    id: "tr-1",
    traitementType: "vente",
    supplyKind: "articles",
    number: "TV-2026-001",
    label: "Test",
    projectId: "proj-1",
    depotId: null,
    supplierId: null,
    customerId: "cust-1",
    partnerName: "Client test",
    status: "in_progress",
    notes: "",
    steps: {
      f: { status: "done", docNumber: "FAC-001", docDate: "2026-05-01", quoteId: "q-1" },
    },
    lines: [{ id: "l1", productId: null, stockItemId: null, reference: "", designation: "Item", unit: "u", qty: 2, unitPrice: 1000, sortOrder: 0 }],
    purchaseRequestId: null,
    sourceTraitementId: null,
    venteTraitementId: null,
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("traitementFinanceDocumentType", () => {
  it("maps vente step F to client_invoice", () => {
    assert.equal(traitementFinanceDocumentType(baseTraitement()), "client_invoice");
  });

  it("maps achat step F to supplier_invoice", () => {
    assert.equal(
      traitementFinanceDocumentType(baseTraitement({ traitementType: "achat", supplierId: "sup-1", customerId: null })),
      "supplier_invoice",
    );
  });

  it("maps gasoil achat step F to supplier_invoice", () => {
    assert.equal(
      traitementFinanceDocumentType(baseTraitement({ supplyKind: "gasoil", traitementType: "achat", supplierId: "sup-1", customerId: null })),
      "supplier_invoice",
    );
  });

  it("skips when step F is not done", () => {
    assert.equal(
      traitementFinanceDocumentType(
        baseTraitement({ steps: { f: { status: "pending", docNumber: "", docDate: "" } } }),
      ),
      null,
    );
  });
});

describe("resolveTraitementInvoiceAmounts", () => {
  it("uses quote totals when quote is provided", () => {
    const quote = {
      id: "q-1",
      createdAt: "2026-05-01",
      clientName: "Client",
      clientIce: "",
      reference: "",
      quoteNumber: "F-2026-42",
      date: "2026-05-10",
      dueDate: "2026-06-10",
      vatRate: 20,
      discount: 0,
      deposit: 0,
      items: [{ productId: "p1", reference: "REF", designation: "X", qty: 1, unitPrice: 1000, unit: "u", isNote: false }],
    } as QuoteDraft;

    const amounts = resolveTraitementInvoiceAmounts(baseTraitement(), quote);
    assert.equal(amounts.documentNumber, "F-2026-42");
    assert.equal(amounts.issueDate, "2026-05-10");
    assert.equal(amounts.dueDate, "2026-06-10");
    assert.equal(amounts.amountTtc, 1200);
  });

  it("falls back to traitement lines with default VAT", () => {
    const amounts = resolveTraitementInvoiceAmounts(baseTraitement(), null);
    assert.equal(amounts.amountHt, 2000);
    assert.equal(amounts.amountTtc, 2400);
    assert.equal(amounts.documentNumber, "FAC-001");
  });
});
