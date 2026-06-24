import type { ReactNode } from "react";
import { inputClass } from "@/components/admin/admin-form-styles";

export function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  children,
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {onSearchChange ? (
        <input
          className={`${inputClass} w-full sm:max-w-xs`}
          placeholder={searchPlaceholder}
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      ) : null}
      {children}
    </div>
  );
}
