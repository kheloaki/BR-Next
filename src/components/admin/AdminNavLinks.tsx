"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_SHORTCUTS,
  filterNavItems,
  findNavGroupLabelForPath,
  isActiveNavPath,
} from "@/lib/admin/admin-nav";
import { ADMIN_SECTION_ICON } from "@/components/admin/admin-nav-icons";
import type { AdminSection } from "@/components/admin/AdminSidebar";

const OPEN_GROUPS_KEY = "admin-nav-open-groups-v2";

function linkClass(active: boolean, collapsed: boolean) {
  if (collapsed) {
    return active
      ? "flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gold)]/15 text-[var(--navy)]"
      : "flex h-10 w-10 items-center justify-center rounded-lg text-[var(--graphite)]/80 transition hover:bg-white hover:text-[var(--navy)]";
  }
  return active
    ? "flex min-h-[40px] items-center gap-2.5 rounded-lg border-l-[3px] border-[var(--gold)] bg-[var(--gold)]/10 py-2 pl-2.5 pr-3 text-sm font-medium text-[var(--navy)]"
    : "flex min-h-[40px] items-center gap-2.5 rounded-lg border-l-[3px] border-transparent py-2 pl-2.5 pr-3 text-sm text-[var(--graphite)]/85 transition hover:bg-white/90 hover:text-[var(--navy)]";
}

function defaultOpenGroups(pathname: string) {
  const activeGroup = findNavGroupLabelForPath(pathname);
  const entries = ADMIN_NAV_GROUPS.filter((g) => g.label).map(
    (g) => [g.label!, g.label === activeGroup] as const,
  );
  return Object.fromEntries(entries) as Record<string, boolean>;
}

function NavLink({
  href,
  label,
  section,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  section: AdminSection;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = ADMIN_SECTION_ICON[section];
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={linkClass(active, collapsed)}
      onClick={onNavigate}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );
}

export function AdminNavLinks({
  active: _active,
  collapsed = false,
  onNavigate,
}: {
  active: AdminSection;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => defaultOpenGroups(pathname));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_GROUPS_KEY);
      if (raw) {
        setOpenGroups({ ...defaultOpenGroups(pathname), ...JSON.parse(raw) });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const activeGroup = findNavGroupLabelForPath(pathname);
    if (!activeGroup) return;
    setOpenGroups((prev) => ({ ...prev, [activeGroup]: true }));
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

  const searchResults = useMemo(() => filterNavItems(search), [search]);
  const isSearching = search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      {!collapsed ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--graphite)]/45"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une page…"
            className="w-full rounded-lg border border-border bg-white py-2 pl-8 pr-8 text-sm outline-none transition placeholder:text-[var(--graphite)]/45 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15"
            aria-label="Rechercher dans le menu"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[var(--graphite)]/55 hover:bg-[var(--background)] hover:text-[var(--navy)]"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}

      {isSearching && !collapsed ? (
        <nav className="space-y-0.5">
          {searchResults.length === 0 ? (
            <p className="px-2 py-3 text-xs text-[var(--graphite)]/60">Aucun résultat pour « {search} »</p>
          ) : (
            searchResults.map((item) => (
              <div key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  section={item.section}
                  active={isActiveNavPath(pathname, item.href)}
                  collapsed={false}
                  onNavigate={onNavigate}
                />
                {item.group ? (
                  <p className="pl-9 text-[10px] text-[var(--graphite)]/50">{item.group}</p>
                ) : null}
              </div>
            ))
          )}
        </nav>
      ) : (
        <>
          {!collapsed ? (
            <div>
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--graphite)]/50">
                Accès rapide
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_NAV_SHORTCUTS.map((item) => {
                  const activeItem = isActiveNavPath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={
                        activeItem
                          ? "rounded-full border border-[var(--gold)]/50 bg-[var(--gold)]/12 px-2.5 py-1 text-xs font-medium text-[var(--navy)]"
                          : "rounded-full border border-border bg-white px-2.5 py-1 text-xs text-[var(--graphite)]/80 transition hover:border-[var(--gold)]/30 hover:text-[var(--navy)]"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 border-b border-border pb-3">
              {ADMIN_NAV_SHORTCUTS.slice(0, 4).map((item) => {
                const Icon = ADMIN_SECTION_ICON[item.section];
                const activeItem = isActiveNavPath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={onNavigate}
                    className={linkClass(activeItem, true)}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  </Link>
                );
              })}
            </div>
          )}

          <nav className={`flex flex-col ${collapsed ? "items-center gap-1" : "gap-0.5"}`}>
            {ADMIN_NAV_GROUPS.map((group, gi) => {
              const isLabeled = Boolean(group.label);

              if (!isLabeled) {
                return (
                  <div key={gi} className={collapsed ? "w-full space-y-1" : "space-y-0.5"}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        section={item.section}
                        active={isActiveNavPath(pathname, item.href)}
                        collapsed={collapsed}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                );
              }

              const open = collapsed ? true : (openGroups[group.label!] ?? false);

              return (
                <div key={group.label} className={gi > 0 && !collapsed ? "pt-1" : ""}>
                  {!collapsed ? (
                    <>
                      {gi > 0 ? <div className="my-2 h-px bg-border/80" aria-hidden /> : null}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.label!)}
                        className="mb-0.5 flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-xs font-semibold text-[var(--graphite)]/70 transition hover:bg-white/80 hover:text-[var(--navy)]"
                        aria-expanded={open}
                      >
                        <span>{group.label}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-normal text-[var(--graphite)]/45">
                            {group.items.length}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                            aria-hidden
                          />
                        </span>
                      </button>
                    </>
                  ) : gi > 0 ? (
                    <div className="my-1.5 h-px w-8 bg-border/80" aria-hidden />
                  ) : null}

                  {open || collapsed ? (
                    <div className={collapsed ? "flex flex-col items-center gap-1" : "space-y-0.5"}>
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          section={item.section}
                          active={isActiveNavPath(pathname, item.href)}
                          collapsed={collapsed}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
