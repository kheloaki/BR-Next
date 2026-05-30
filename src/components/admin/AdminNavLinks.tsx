"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/admin-nav";
import { ADMIN_SECTION_ICON } from "@/components/admin/admin-nav-icons";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import { isFacturationPath } from "@/lib/admin/facturation-nav";
import { isFuelPath } from "@/lib/admin/fuel-nav";

const OPEN_GROUPS_KEY = "admin-nav-open-groups";

function itemClass(active: boolean, collapsed: boolean, nested = false) {
  const base = collapsed
    ? "flex min-h-[44px] items-center justify-center rounded-lg border px-0"
    : nested
      ? "flex min-h-[40px] items-center gap-2 rounded-lg border py-2 pl-3 pr-3 text-[13px]"
      : "flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 text-sm";
  if (active) {
    return `${base} border-[var(--gold)]/40 bg-[var(--gold)]/12 font-medium text-[var(--navy)]`;
  }
  return `${base} border-transparent text-[var(--graphite)]/85 transition hover:border-border hover:bg-white`;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function defaultOpenGroups() {
  const entries = ADMIN_NAV_GROUPS.filter((g) => g.label).map((g) => [g.label!, true] as const);
  return Object.fromEntries(entries) as Record<string, boolean>;
}

export function AdminNavLinks({
  active,
  collapsed = false,
  onNavigate,
}: {
  active: AdminSection;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpenGroups);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_GROUPS_KEY);
      if (raw) setOpenGroups({ ...defaultOpenGroups(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isFuelPath(pathname)) {
      setOpenGroups((prev) => ({ ...prev, Carburant: true }));
    }
    if (isFacturationPath(pathname)) {
      setOpenGroups((prev) => ({ ...prev, Facturation: true }));
    }
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(openGroups));
    } catch {
      /* ignore */
    }
  }, [openGroups]);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {ADMIN_NAV_GROUPS.map((group, gi) => {
        const isLabeled = Boolean(group.label);

        if (!isLabeled) {
          return (
            <div key={gi} className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ADMIN_SECTION_ICON[item.section];
                const activeItem = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={itemClass(activeItem, collapsed)}
                    onClick={onNavigate}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          );
        }

        const open = collapsed ? true : (openGroups[group.label!] ?? true);

        return (
          <div key={group.label} className={gi > 0 && !collapsed ? "pt-1" : ""}>
            {!collapsed ? (
              <>
                {gi > 0 ? <div className="my-2 h-px bg-border" aria-hidden /> : null}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label!)}
                  className="mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--graphite)]/55 transition hover:bg-white/80"
                  aria-expanded={open}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                    aria-hidden
                  />
                </button>
              </>
            ) : null}

            {open || collapsed ? (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ADMIN_SECTION_ICON[item.section];
                  const activeItem = isActive(pathname, item.href);
                  const nested =
                    (group.label === "Carburant" && item.href.startsWith("/admin/fuel/")) ||
                    (group.label === "Facturation" &&
                      (item.href === "/admin/facturation/bon-commande" ||
                        item.href === "/admin/facturation/facture"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={itemClass(activeItem, collapsed, nested && !collapsed)}
                      onClick={onNavigate}
                    >
                      <Icon
                        className={`shrink-0 ${nested && !collapsed ? "h-4 w-4" : "h-[18px] w-[18px]"}`}
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

    </nav>
  );
}
