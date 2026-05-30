import type { ReactNode } from "react";
import { inputClass, sectionTitle } from "@/components/admin/admin-form-styles";

export function AdminInventoryCard({
  title,
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  actions,
  children,
}: {
  title: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm shadow-black/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h3 className={`${sectionTitle} text-base`}>{title}</h3>
        <div className="flex flex-wrap items-center gap-2 ms-auto">
          {onSearchChange ? (
            <input
              className={`${inputClass} w-full min-w-[200px] max-w-[260px] min-h-[38px] py-2 text-sm`}
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          ) : null}
          {actions}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
