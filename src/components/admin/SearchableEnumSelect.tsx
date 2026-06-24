"use client";

import { useMemo } from "react";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Record<string, string> | SearchableSelectOption[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  compact?: boolean;
};

export function SearchableEnumSelect({
  options,
  ...rest
}: Props) {
  const normalized = useMemo((): SearchableSelectOption[] => {
    if (Array.isArray(options)) return options;
    return Object.entries(options).map(([value, label]) => ({ value, label }));
  }, [options]);

  return <SearchableSelect options={normalized} {...rest} />;
}
