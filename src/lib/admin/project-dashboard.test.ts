import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCumulativeCostSeries,
  computeCostBreakdown,
  computeProjectPaymentKpis,
  computeResteARecevoir,
  computeTotalCostMad,
} from "./project-dashboard.ts";

describe("computeResteARecevoir", () => {
  it("returns budget minus paid, floored at zero", () => {
    assert.equal(computeResteARecevoir(100_000, 30_000), 70_000);
    assert.equal(computeResteARecevoir(50_000, 80_000), 0);
  });
});

describe("computeCostBreakdown", () => {
  it("rounds each bucket", () => {
    const b = computeCostBreakdown(6880, 5715.4, 2150);
    assert.equal(b.materials, 6880);
    assert.equal(b.labor, 5715.4);
    assert.equal(b.other, 2150);
  });
});

describe("computeTotalCostMad", () => {
  it("sums breakdown parts", () => {
    const total = computeTotalCostMad(computeCostBreakdown(1000, 500, 200));
    assert.equal(total, 1700);
  });
});

describe("buildCumulativeCostSeries", () => {
  it("orders dates ascending and accumulates totals", () => {
    const series = buildCumulativeCostSeries([
      { date: "2026-04-18", amount: 1000 },
      { date: "2026-04-13", amount: 500 },
      { date: "2026-04-18", amount: 200 },
    ]);
    assert.deepEqual(series, [
      { date: "2026-04-13", total: 500 },
      { date: "2026-04-18", total: 1700 },
    ]);
  });

  it("returns empty for no events", () => {
    assert.deepEqual(buildCumulativeCostSeries([]), []);
  });
});

describe("computeProjectPaymentKpis", () => {
  it("sums invoice paid amounts and unallocated income movements", () => {
    const kpis = computeProjectPaymentKpis(
      100_000,
      [
        { paidAmount: 30_000, remainingAmount: 20_000 },
        { paidAmount: 10_000, remainingAmount: 0 },
      ],
      [
        { id: "m1", amount: 30_000 },
        { id: "m2", amount: 10_000 },
        { id: "m3", amount: 5_000 },
      ],
      new Set(["m1", "m2"]),
    );
    assert.equal(kpis.montantPaye, 45_000);
    assert.equal(kpis.resteARecevoir, 20_000);
  });

  it("uses budget minus paid when no client invoices exist", () => {
    const kpis = computeProjectPaymentKpis(
      80_000,
      [],
      [{ id: "m1", amount: 25_000 }],
      new Set(),
    );
    assert.equal(kpis.montantPaye, 25_000);
    assert.equal(kpis.resteARecevoir, 55_000);
  });
});
