"use client";

import { thClass } from "@/components/admin/admin-form-styles";
import type { SortState } from "@/lib/admin/table-sort";

const sortBtnClass =
  "inline-flex w-full items-center gap-1 border-0 bg-transparent p-0 font-inherit text-inherit uppercase tracking-wide hover:text-[var(--navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 rounded";

type Props = {
  label: string;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
  align?: "left" | "right";
};

export function AdminSortableTh({
  label,
  sortKey,
  sort,
  onSort,
  className,
  align = "left",
}: Props) {
  const active = sort?.key === sortKey;
  const indicator = active ? (sort.dir === "asc" ? "↑" : "↓") : "↕";

  return (
    <th className={className ?? thClass}>
      <button
        type="button"
        className={`${sortBtnClass} ${align === "right" ? "justify-end text-right" : "text-left"}`}
        onClick={() => onSort(sortKey)}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        <span className={`text-[10px] ${active ? "text-[var(--navy)]" : "text-[var(--graphite)]/35"}`}>
          {indicator}
        </span>
      </button>
    </th>
  );
}
