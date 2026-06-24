"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/components/admin/devis-types";
import { btnSecondary, btnSecondarySm } from "@/components/admin/admin-form-styles";
import { ProductFormSheet } from "@/components/admin/ProductFormSheet";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

function formatProductLabel(product: Product, stockQty?: number) {
  const base = `${product.reference ? `${product.reference} — ` : ""}${product.designation}`;
  if (stockQty != null) return `${base} · stock ${stockQty}`;
  return base;
}

type Props = {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  onProductAdded?: (product: Product) => void;
  placeholder?: string;
  /** After pick, reset dropdown (catalogue picker that adds a line). */
  resetAfterSelect?: boolean;
  /** Optional stock qty per product id for option labels. */
  stockByProductId?: Map<string, { qty: number }>;
  compact?: boolean;
  className?: string;
};

export function ProductSelectWithAdd({
  products,
  value,
  onChange,
  onProductAdded,
  placeholder = "— Choisir un article —",
  resetAfterSelect = false,
  stockByProductId,
  compact = false,
  className,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const options = useMemo((): SearchableSelectOption[] => {
    return [...products]
      .sort((a, b) =>
        (a.designation || a.reference).localeCompare(b.designation || b.reference, "fr"),
      )
      .map((p) => ({
        value: p.id,
        label: formatProductLabel(p, stockByProductId?.get(p.id)?.qty),
        keywords: `${p.reference} ${p.designation} ${p.category ?? ""}`,
      }));
  }, [products, stockByProductId]);

  function handleSelect(id: string) {
    if (!id) return;
    onChange(id);
    if (resetAfterSelect) setResetKey((k) => k + 1);
  }

  function handleSaved(product: Product) {
    onProductAdded?.(product);
    handleSelect(product.id);
  }

  const selectValue = resetAfterSelect ? "" : value;
  const addBtnClass = compact ? `${btnSecondarySm} shrink-0 min-h-[36px] px-2` : `${btnSecondary} shrink-0 px-3`;

  return (
    <>
      <div className={`flex gap-1.5 min-w-0 ${className ?? ""}`}>
        <SearchableSelect
          key={resetKey}
          options={options}
          value={selectValue}
          onChange={handleSelect}
          placeholder={placeholder}
          compact={compact}
          className="flex-1"
        />
        <button
          type="button"
          className={addBtnClass}
          onClick={() => setSheetOpen(true)}
          title="Nouvel article"
          aria-label="Nouvel article"
        >
          +
        </button>
      </div>

      <ProductFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
