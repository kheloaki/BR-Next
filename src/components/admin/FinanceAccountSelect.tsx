"use client";

import { useMemo } from "react";
import type { FinanceAccount } from "@/lib/admin/finance-types";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

export function FinanceAccountSelect({
  accounts,
  value,
  onChange,
  placeholder = "Sélectionner…",
  inputClassName,
  disabled = false,
}: {
  accounts: FinanceAccount[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const options = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.name} (${(a.balance ?? 0).toLocaleString("fr-MA")} MAD)`,
        keywords: a.name,
      })),
    [accounts],
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
