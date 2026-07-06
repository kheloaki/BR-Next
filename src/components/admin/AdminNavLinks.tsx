"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  ADMIN_NAV_GROUPS,
  filterNavItems,
  findNavGroupLabelForPath,
  isActiveNavPath,
} from "@/lib/admin/admin-nav";
import { ADMIN_SECTION_ICON } from "@/components/admin/admin-nav-icons";
import { AdminLink } from "@/components/admin/ux/AdminLink";
import type { AdminSection } from "@/components/admin/AdminSidebar";

const OPEN_GROUPS_KEY = "admin-nav-open-groups-v2";

function linkClass(active: boolean, collapsed: boolean) {
  if (collapsed) {
    return active
      ? "flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-sm)] bg-white text-[var(--navy)] shadow-[var(--admin-shadow)]"
      : "flex h-9 w-9 items-center justify-center rounded-[var(--admin-radius-sm)] text-[var(--graphite)] transition hover:bg-white/90 hover:text-[var(--navy)]";
  }
  return active
    ? "flex min-h-[34px] items-center gap-2 rounded-[var(--admin-radius-sm)] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[var(--navy)] shadow-[var(--admin-shadow)]"
    : "flex min-h-[34px] items-center gap-2 rounded-[var(--admin-radius-sm)] px-2.5 py-1.5 text-[13px] text-[var(--graphite)] transition hover:bg-white/70 hover:text-[var(--navy)]";
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
    <AdminLink
      href={href}
      title={collapsed ? label : undefined}
      className={linkClass(active, collapsed)}
      onClick={onNavigate}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </AdminLink>
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
    <div className="flex flex-col gap-4">
      {!collapsed ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--graphite)]"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-[var(--admin-radius-pill)] border border-border/80 bg-white py-2 pl-9 pr-12 text-[13px] shadow-sm outline-none transition placeholder:text-[var(--graphite)] focus:border-[var(--admin-accent)]/30 focus:ring-2 focus:ring-[var(--admin-accent)]/10"
            aria-label="Rechercher dans le menu"
          />
          {!search ? (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[var(--admin-radius-sm)] border border-border bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--graphite)]">
              /
            </kbd>
          ) : null}
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
          <nav className={`flex flex-col ${collapsed ? "items-center gap-0.5" : "gap-0.5"}`}>
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
                      {gi > 0 ? <div className="my-3 h-px bg-border/70" aria-hidden /> : null}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.label!)}
                        className="mb-1 flex w-full items-center justify-between px-2 py-1 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--graphite)] transition hover:text-[var(--navy)]"
                        aria-expanded={open}
                      >
                        <span>{group.label}</span>
                        <ChevronDown
                          className={`h-3 w-3 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
                          aria-hidden
                        />
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
