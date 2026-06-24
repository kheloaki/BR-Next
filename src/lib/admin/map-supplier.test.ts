import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatSupplierDisplayName, supplierDocumentCompanyName } from "@/lib/admin/map-supplier";

describe("supplierDocumentCompanyName", () => {
  it("prefers company name over contact name", () => {
    assert.equal(
      supplierDocumentCompanyName({
        supplierName: "Ahmed",
        companyName: "STE CEMOS-CIMENT",
        name: "Ahmed — STE CEMOS-CIMENT",
      }),
      "STE CEMOS-CIMENT",
    );
  });

  it("extracts company from legacy combined display name", () => {
    assert.equal(
      supplierDocumentCompanyName({
        supplierName: "Ahmed",
        companyName: "",
        name: formatSupplierDisplayName("Ahmed", "STE CEMOS-CIMENT"),
      }),
      "STE CEMOS-CIMENT",
    );
  });

  it("falls back to supplier name when no company", () => {
    assert.equal(
      supplierDocumentCompanyName({
        supplierName: "Ahmed",
        companyName: "",
        name: "Ahmed",
      }),
      "Ahmed",
    );
  });
});
