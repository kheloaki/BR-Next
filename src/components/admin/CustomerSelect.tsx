"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

export function CustomerSelect({
  customers,
  value,
  onChange,
  placeholder = "—",
  inputClassName,
  disabled = false,
}: {
  customers: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean;
}) {
  const options = useMemo(
    () => customers.map((c) => ({ value: c.id, label: c.name, keywords: c.name })),
    [customers],
  );

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputClassName={inputClassName}
      disabled={disabled}
      allowEmpty
    />
  );
}
