import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { QuoteDraft } from "@/components/admin/devis-types";
import type { StockMovement } from "@/components/admin/operations-types";
import type { RentalContract } from "@/components/admin/operations-types";
import type { Traitement } from "@/lib/admin/traitement-types";
import {
  computeFacturationTotals,
  computeProfitabilityLines,
  computeQuoteTotals,
  computeRentalTotals,
  computeStockTotals,
  sumGasoilSortieLitres,
  sumTraitementAchats,
  traitementLinesTotal,
} from "@/lib/admin/project-report-calculations";

describe("project-report-calculations", () => {
  it("sums gasoil sortie litres", () => {
    const total = sumGasoilSortieLitres([{ litres: 100 }, { litres: 50.5 }]);
    assert.equal(total, 150.5);
  });

  it("computes stock entrees and sorties", () => {
    const movements: StockMovement[] = [
      {
        id: "1",
        itemId: "i",
        movementType: "entry",
        movementDate: "2026-01-01",
        reference: "A",
        designation: "X",
        category: "",
        articleCode: "",
        unit: "u",
        qty: 10,
        unitPrice: 5,
        totalPriceHt: 50,
        stockAfter: 10,
        assignment: "",
        exitVoucherNo: "",
        requester: "",
        storekeeper: "",
        supplier: "",
        deliveryNote: "",
        siteName: "",
        projectId: "p",
        depotId: null,
        notes: "",
        traitementLink: null,
        createdAt: "",
      },
      {
        id: "2",
        itemId: "i",
        movementType: "exit",
        movementDate: "2026-01-02",
        reference: "B",
        designation: "X",
        category: "",
        articleCode: "",
        unit: "u",
        qty: 3,
        unitPrice: 5,
        totalPriceHt: 15,
        stockAfter: 7,
        assignment: "",
        exitVoucherNo: "",
        requester: "",
        storekeeper: "",
        supplier: "",
        deliveryNote: "",
        siteName: "",
        projectId: "p",
        depotId: null,
        notes: "",
        traitementLink: null,
        createdAt: "",
      },
    ];
    const t = computeStockTotals(movements);
    assert.equal(t.entrees, 10);
    assert.equal(t.sorties, 3);
    assert.equal(t.valeurHt, 15);
  });

  it("computes rental totals", () => {
    const contracts = [
      { totalMad: 1000, id: "1" },
      { totalMad: 500, id: "2" },
    ] as RentalContract[];
    const t = computeRentalTotals(contracts, 20);
    assert.equal(t.ht, 1500);
    assert.equal(t.tva, 300);
    assert.equal(t.ttc, 1800);
  });

  it("computes HT/TVA/TTC for quotes", () => {
    const quote: QuoteDraft = {
      id: "q1",
      createdAt: "2026-01-01",
      clientName: "Client",
      clientIce: "",
      quoteNumber: "D-1",
      reference: "",
      date: "2026-01-01",
      vatRate: 20,
      discount: 0,
      deposit: 0,
      items: [{ productId: "p", reference: "R", designation: "Item", qty: 2, unitPrice: 100 }],
    };
    const t = computeQuoteTotals(quote);
    assert.equal(t.ht, 200);
    assert.equal(t.vat, 40);
    assert.equal(t.ttc, 240);
    assert.equal(computeFacturationTotals([quote]).ttc, 240);
  });

  it("computes traitement achat totals", () => {
    const traitements = [
      {
        traitementType: "achat",
        lines: [{ qty: 2, unitPrice: 50 }],
      },
    ] as Traitement[];
    assert.equal(traitementLinesTotal(traitements[0]!.lines), 100);
    assert.equal(sumTraitementAchats(traitements), 100);
  });

  it("computes profitability margin", () => {
    const { totals } = computeProfitabilityLines({
      gasoilCost: 1000,
      rentalHt: 500,
      partsCost: 200,
      daTotal: 300,
      achatsHt: 400,
      ventesHt: 5000,
    });
    assert.equal(totals.costs, 2400);
    assert.equal(totals.revenue, 5000);
    assert.equal(totals.margin, 2600);
    assert.equal(totals.marginPct, 52);
  });
});
