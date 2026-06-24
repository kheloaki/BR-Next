"use client";

import { useMemo } from "react";
import type { ProductCategory } from "@/components/admin/devis-types";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function ProductCategorySelect({
  categories,
  value,
  onChange,
  allowEmpty = true,
  placeholder = "Catégorie…",
  className,
}: {
  categories: ProductCategory[];
  value: string;
  onChange: (name: string) => void;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const options = useMemo((): SearchableSelectOption[] => {
    return categories.map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [categories]);

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      allowEmpty={allowEmpty}
      placeholder={placeholder}
      className={className}
    />
  );
}
