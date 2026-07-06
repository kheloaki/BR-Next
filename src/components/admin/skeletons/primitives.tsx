import type { CSSProperties, ReactNode } from "react";
import { card, moduleWrap } from "@/components/admin/admin-form-styles";

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function SkeletonStatus({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function SkeletonBone({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--admin-radius-sm)] bg-[var(--graphite)]/10", className)}
      style={style}
      aria-hidden
    />
  );
}

export function SkeletonModuleHeader({
  actionCount = 1,
  hasExport = false,
}: {
  actionCount?: number;
  hasExport?: boolean;
}) {
  return (
    <div className="border-b border-border pb-4 mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2 min-w-0 flex-1">
        <SkeletonBone className="h-8 w-56 max-w-full" />
        <SkeletonBone className="h-4 w-full max-w-2xl" />
        <SkeletonBone className="h-4 w-4/5 max-w-xl" />
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {hasExport ? <SkeletonBone className="h-11 w-24 rounded-[var(--admin-radius-pill)]" /> : null}
        {Array.from({ length: actionCount }, (_, i) => (
          <SkeletonBone key={i} className="h-11 w-36 rounded-[var(--admin-radius-pill)]" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonBackLink() {
  return <SkeletonBone className="mb-2 h-3 w-20" />;
}

export function SkeletonMiniStats({ count = 3 }: { count?: number }) {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${card} p-4 space-y-2`}>
          <SkeletonBone className="h-3 w-20" />
          <SkeletonBone className="h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTabs({ labels }: { labels: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
      {labels.map((label) => (
        <SkeletonBone
          key={label}
          className="h-9 rounded-[var(--admin-radius-pill)]"
          style={{ width: `${Math.max(label.length * 9, 72)}px` }}
        />
      ))}
    </div>
  );
}

export function SkeletonFilterBar({ fields = 0 }: { fields?: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <SkeletonBone className="h-10 min-w-[220px] flex-1 max-w-md rounded-[var(--admin-radius-pill)]" />
      {Array.from({ length: fields }, (_, i) => (
        <SkeletonBone key={i} className="h-10 w-40 rounded-[var(--admin-radius-pill)]" />
      ))}
    </div>
  );
}

export function SkeletonFieldRow({ cols = 3 }: { cols?: number }) {
  return (
    <div className={cn("flex flex-wrap items-end gap-2 border-b border-border px-4 py-3", cols > 1 && "gap-3")}>
      {Array.from({ length: cols }, (_, i) => (
        <div key={i} className="space-y-1">
          <SkeletonBone className="h-3 w-14" />
          <SkeletonBone className="h-10 w-36 rounded-[var(--admin-radius-pill)]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  cols,
  rows = 6,
  colWidths,
}: {
  cols: number;
  rows?: number;
  colWidths?: string[];
}) {
  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <div className="flex gap-3">
          {Array.from({ length: cols }, (_, i) => (
            <SkeletonBone
              key={i}
              className={cn("h-3.5 flex-1", colWidths?.[i] ?? (i === cols - 1 ? "max-w-[72px]" : undefined))}
            />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-3 px-4 py-3.5">
            {Array.from({ length: cols }, (_, col) => (
              <SkeletonBone
                key={col}
                className={cn("h-4 flex-1", colWidths?.[col] ?? (col === 0 ? "max-w-[100px]" : col === cols - 1 ? "max-w-[64px]" : undefined))}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonInventoryCard({
  cols,
  rows = 6,
  hasSearch = true,
  toolbarSelect = false,
  filterFields = 0,
  colWidths,
}: {
  cols: number;
  rows?: number;
  hasSearch?: boolean;
  toolbarSelect?: boolean;
  filterFields?: number;
  colWidths?: string[];
}) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <SkeletonBone className="h-5 w-44" />
        <div className="flex flex-wrap gap-2">
          {hasSearch ? <SkeletonBone className="h-9 w-56 rounded-[var(--admin-radius-pill)]" /> : null}
          {toolbarSelect ? <SkeletonBone className="h-9 w-40 rounded-[var(--admin-radius-pill)]" /> : null}
        </div>
      </div>
      {filterFields > 0 ? <SkeletonFieldRow cols={filterFields} /> : null}
      <SkeletonTable cols={cols} rows={rows} colWidths={colWidths} />
    </div>
  );
}

export function SkeletonProjectCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${card} overflow-hidden p-4 space-y-3`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <SkeletonBone className="h-3 w-16" />
              <SkeletonBone className="h-5 w-4/5" />
            </div>
            <SkeletonBone className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <SkeletonBone className="h-3.5 w-full" />
            <SkeletonBone className="h-3.5 w-3/4" />
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            <SkeletonBone className="h-10" />
            <SkeletonBone className="h-10" />
            <SkeletonBone className="h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonFormCard({ fields = 6 }: { fields?: number }) {
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="border-b border-border px-5 py-4">
        <SkeletonBone className="h-5 w-40" />
        <SkeletonBone className="mt-2 h-3.5 w-64" />
      </div>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className={cn("space-y-2", i === fields - 1 && fields % 3 !== 0 && "sm:col-span-2")}>
            <SkeletonBone className="h-3 w-24" />
            <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border px-5 py-4">
        <SkeletonBone className="h-11 w-28 rounded-[var(--admin-radius-pill)]" />
        <SkeletonBone className="h-11 w-32 rounded-[var(--admin-radius-pill)]" />
      </div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className={`${card} mb-4 px-4 py-3`}>
      <SkeletonBone className="h-4 w-full" />
      <SkeletonBone className="mt-2 h-4 w-5/6" />
    </div>
  );
}

export function SkeletonSheetForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBone className="h-3 w-20" />
          <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ label, partial, children }: { label: string; partial?: boolean; children: ReactNode }) {
  return (
    <SkeletonStatus label={label}>
      <div className={partial ? "space-y-4" : moduleWrap}>{children}</div>
    </SkeletonStatus>
  );
}

export function SkeletonFinanceDetailCard() {
  return (
    <div className={`${card} mb-4 overflow-hidden shadow-sm shadow-black/[0.03]`}>
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <SkeletonBone className="h-5 w-36" />
      </div>
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBone className="h-3 w-16" />
            <SkeletonBone className="h-5 w-24" />
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-4 sm:px-5">
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
          <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonQuoteBuilderHeader() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="space-y-2">
        <SkeletonBone className="h-9 w-64" />
        <SkeletonBone className="h-3 w-48" />
      </div>
      <SkeletonBone className="h-10 w-72 rounded-[var(--admin-radius-pill)]" />
    </div>
  );
}

export function SkeletonQuoteBuilderBody() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <SkeletonFormCard fields={8} />
        <SkeletonInventoryCard cols={6} rows={5} hasSearch={false} />
      </div>
      <div className={`${card} h-fit p-4 space-y-3`}>
        <SkeletonBone className="h-5 w-32" />
        <SkeletonBone className="h-4 w-full" />
        <SkeletonBone className="h-4 w-full" />
        <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
        <SkeletonBone className="h-11 w-full rounded-[var(--admin-radius-pill)]" />
      </div>
    </div>
  );
}

export function SkeletonGasoilStockPanel() {
  return (
    <>
      <SkeletonMiniStats count={3} />
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBone className="h-3 w-24" />
            <SkeletonBone className="h-8 w-32" />
          </div>
          <SkeletonBone className="h-10 w-36 rounded-[var(--admin-radius-pill)]" />
        </div>
        <SkeletonTable cols={5} rows={4} />
      </div>
    </>
  );
}

export function SkeletonMembersTable({ cols = 5, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className={`${card} overflow-hidden`}>
      <SkeletonTable cols={cols} rows={rows} />
    </div>
  );
}
