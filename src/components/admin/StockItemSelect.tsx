"use client";

import { useMemo } from "react";
import type { StockItem } from "@/components/admin/operations-types";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

export function StockItemSelect({
  items,
  value,
  onChange,
  placeholder = "— Sélectionner —",
  inputClassName,
  disabled = false,
  showStock = true,
}: {
  items: StockItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
  showStock?: boolean;
}) {
  const options = useMemo(
    () =>
      items.map((i) => ({
        value: i.id,
        label: showStock
          ? `${i.reference} — ${i.designation} (stock: ${i.qty} ${i.unit})`
          : `${i.reference} — ${i.designation}`,
        keywords: `${i.reference} ${i.designation}`,
      })),
    [items, showStock],
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputClassName={inputClassName}
      disabled={disabled}
    />
  );
}
