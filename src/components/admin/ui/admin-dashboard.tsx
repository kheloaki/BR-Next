import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { card, cardMuted, linkAccent } from "@/components/admin/admin-form-styles";
import type { DashboardWeekBucket } from "@/lib/admin/dashboard-stats";
import { cn } from "@/lib/utils";

export const ADMIN_ICON_TONES = {
  blue: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  pink: "bg-pink-50 text-pink-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

export type AdminIconTone = keyof typeof ADMIN_ICON_TONES;

export function AdminSectionBlock({
  title,
  dismissLabel,
  onDismiss,
  children,
  className,
}: {
  title: string;
  dismissLabel?: string;
  onDismiss?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(cardMuted, "p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-[var(--navy)]">{title}</h2>
        {dismissLabel && onDismiss ? (
          <button type="button" onClick={onDismiss} className={linkAccent}>
            {dismissLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function AdminHeroKpi({
  href,
  label,
  value,
  sub,
  tone,
  variant = "default",
  progress,
}: {
  href: string;
  label: string;
  value: string;
  sub: string;
  tone: AdminIconTone;
  variant?: "default" | "success" | "warning";
  progress?: number;
}) {
  const pct = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;
  const borderClass =
    variant === "warning"
      ? "border-amber-200/80"
      : variant === "success"
        ? "border-emerald-200/80"
        : "border-border/80";

  return (
    <Link
      href={href}
      className={cn(
        card,
        borderClass,
        "group flex min-h-[120px] flex-col justify-between p-4 transition hover:border-[var(--graphite)]/25",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--graphite)]">{label}</p>
        {variant === "warning" ? (
          <TrendingDown className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        ) : variant === "success" ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        ) : null}
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-[var(--navy)] sm:text-[1.65rem]">{value}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--graphite)]">{sub}</p>
        {pct !== undefined ? (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-[var(--admin-accent)]" : "bg-amber-400",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function AdminInitCard({
  href,
  title,
  description,
  icon: Icon,
  tone,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: AdminIconTone;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        card,
        "group relative flex h-full min-h-[100px] flex-col p-4 transition hover:border-[var(--graphite)]/20",
      )}
    >
      <ChevronRight
        className="absolute right-3 top-3 h-4 w-4 text-[var(--graphite)]/30 transition group-hover:text-[var(--graphite)]"
        aria-hidden
      />
      <div className="mb-2 flex items-center justify-between gap-2 pr-5">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-md)]", ADMIN_ICON_TONES[tone])}>
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </div>
        {badge ? (
          <span className="rounded-[var(--admin-radius-pill)] bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--navy)]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-[var(--navy)]">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--graphite)]">{description}</p>
    </Link>
  );
}

export function AdminMetricCard({
  href,
  label,
  value,
  sub,
  progress,
  icon: Icon,
  tone,
  alert,
}: {
  href: string;
  label: string;
  value: string;
  sub: string;
  progress?: number;
  icon: LucideIcon;
  tone: AdminIconTone;
  alert?: boolean;
}) {
  const pct = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <Link
      href={href}
      className={cn(
        card,
        "flex items-start gap-3 p-3.5 transition hover:border-[var(--graphite)]/20",
        alert && "border-amber-200/80 bg-amber-50/30",
      )}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius-md)]", ADMIN_ICON_TONES[tone])}>
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-[var(--graphite)]">{label}</p>
        <p className="mt-0.5 text-lg font-semibold leading-tight text-[var(--navy)]">{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-[var(--graphite)]">{sub}</p>
        {pct !== undefined ? (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className={cn("h-full rounded-full transition-all", alert ? "bg-amber-500" : "bg-[var(--admin-accent)]/70")}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function AdminCommercialBreakdown({
  items,
}: {
  items: { label: string; count: number; amount: string; tone: AdminIconTone }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={cn(card, "px-3 py-2.5")}>
          <p className="text-[10px] uppercase tracking-wide text-[var(--graphite)]">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--navy)]">{item.amount}</p>
          <p className="text-[10px] text-[var(--graphite)]">{item.count} document{item.count !== 1 ? "s" : ""}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(card, "overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--navy)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function AdminToolbarPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--admin-radius-pill)] border border-border/80 bg-white px-3 py-1 text-xs text-[var(--navy)] shadow-sm">
      {children}
    </span>
  );
}

export function AdminStatusPill({
  label = "Opérationnel",
  variant = "success",
}: {
  label?: string;
  variant?: "success" | "warning";
}) {
  const color = variant === "warning" ? "text-amber-600" : "text-emerald-600";
  const dot = variant === "warning" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

export function AdminActivityChart({ weeks }: { weeks: DashboardWeekBucket[] }) {
  const maxTtc = Math.max(...weeks.map((w) => w.totalTtc), 1);
  const maxDocs = Math.max(...weeks.map((w) => w.docsCount), 1);

  return (
    <div className="mt-4 rounded-[var(--admin-radius-md)] border border-border/70 bg-[var(--muted)]/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--graphite)]">
        <span>Activité commerciale par semaine</span>
        <span>Montants TTC · barres = volume documents</span>
      </div>
      <div className="relative flex h-36 items-end gap-2 border-b border-border/80 pb-1">
        {weeks.map((week) => {
          const heightPct = Math.max(8, (week.totalTtc / maxTtc) * 100);
          const docPct = Math.max(6, (week.docsCount / maxDocs) * 55);
          return (
            <div key={week.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[9px] tabular-nums text-[var(--graphite)]">{week.docsCount}</span>
              <div className="flex w-full flex-col justify-end gap-0.5" style={{ height: "100%" }}>
                <div
                  className="w-full rounded-t-sm bg-sky-300/80"
                  style={{ height: `${docPct}%` }}
                  title={`${week.docsCount} documents`}
                />
                <div
                  className="w-full rounded-t-sm bg-[var(--admin-accent)]/60"
                  style={{ height: `${heightPct * 0.45}%`, minHeight: week.totalTtc > 0 ? "4px" : 0 }}
                  title={`${week.totalTtc.toLocaleString("fr-MA")} MAD TTC`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-medium text-[var(--graphite)]">
        {weeks.map((w) => (
          <span key={w.label} className="flex-1 text-center">
            {w.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-[10px] text-[var(--graphite)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-sky-300/80" />
          Nb documents
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--admin-accent)]/60" />
          Montant TTC
        </span>
      </div>
    </div>
  );
}

export function AdminFinanceLockedCard() {
  return (
    <div className={cn(card, "border-dashed px-5 py-8 text-center")}>
      <p className="text-sm font-medium text-[var(--navy)]">Module Finance</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--graphite)]">
        Les indicateurs de trésorerie, encaissements et créances sont réservés aux rôles Financier, Comptable ou Admin.
      </p>
      <Link href="/admin/utilisateurs" className={`${linkAccent} mt-3 inline-block`}>
        Gérer les accès utilisateurs
      </Link>
    </div>
  );
}

export function AdminAttentionList({
  items,
}: {
  items: { label: string; href: string; count?: number }[];
}) {
  if (items.length === 0) return null;

  return (
    <div className={cn(card, "border-amber-200/80 bg-amber-50/40 p-4")}>
      <p className="text-sm font-medium text-amber-950">Points d&apos;attention</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-amber-900 hover:underline">
              {item.count != null && item.count > 0 ? (
                <>
                  <strong>{item.count}</strong> {item.label}
                </>
              ) : (
                item.label
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
