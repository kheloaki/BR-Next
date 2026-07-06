import type { ReactNode } from "react";
import { inputClass, inventoryPanelTitle, sectionTitle } from "@/components/admin/admin-form-styles";

export function AdminInventoryCard({
  title,
  titleClassName,
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  actions,
  children,
}: {
  title: string;
  titleClassName?: string;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[var(--admin-radius-lg)] border border-border/80 bg-white shadow-[var(--admin-shadow-card)]">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
        <h3 className={titleClassName ?? `${sectionTitle} text-base`}>{title}</h3>
        <div className="flex w-full flex-col gap-2 sm:ms-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {onSearchChange ? (
            <input
              className={`${inputClass} w-full min-h-[38px] py-2 text-sm sm:max-w-[260px]`}
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          ) : null}
          {actions}
        </div>
      </div>
      <div className="overflow-x-auto touch-pan-x overscroll-x-contain">{children}</div>
    </div>
  );
}
