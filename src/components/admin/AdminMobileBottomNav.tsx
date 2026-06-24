"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  ADMIN_MOBILE_TABS,
  findActiveMobileTab,
  isMobileTabActive,
  type AdminMobileTab,
  type AdminMobileTabId,
} from "@/lib/admin/admin-mobile-nav";
import { ADMIN_SECTION_ICON } from "@/components/admin/admin-nav-icons";
import { filterNavItems, isActiveNavPath } from "@/lib/admin/admin-nav";
import { ADMIN_QUICK_ACTION_GROUPS } from "@/lib/admin/admin-quick-actions";

function HubSheet({
  tab,
  open,
  onClose,
}: {
  tab: AdminMobileTab;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const searchResults = useMemo(() => filterNavItems(search), [search]);
  const showPlusExtras = tab.id === "plus";

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fermer le menu"
        className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={tab.label}
        className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(85dvh,640px)] flex-col rounded-t-2xl border border-border bg-white shadow-2xl lg:hidden animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex shrink-0 items-center justify-center pt-2">
          <div className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-[var(--navy)]">{tab.label}</p>
            {tab.description ? (
              <p className="mt-0.5 text-xs text-[var(--graphite)]/65">{tab.description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-[var(--graphite)] hover:bg-[var(--background)]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showPlusExtras ? (
          <div className="shrink-0 border-b border-border px-4 py-3">
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
                className="w-full rounded-lg border border-border bg-[var(--background)] py-2.5 pl-8 pr-3 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/15"
              />
            </div>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {search.trim() ? (
            <div className="space-y-1">
              {searchResults.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--graphite)]/60">Aucun résultat</p>
              ) : (
                searchResults.map((item) => {
                  const Icon = ADMIN_SECTION_ICON[item.section];
                  const active = isActiveNavPath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={
                        active
                          ? "flex items-center gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-3"
                          : "flex items-center gap-3 rounded-xl border border-border px-3 py-3 transition hover:bg-[var(--background)]"
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0 text-[var(--navy)]" strokeWidth={1.75} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--navy)]">{item.label}</p>
                        {item.group ? (
                          <p className="truncate text-xs text-[var(--graphite)]/55">{item.group}</p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {tab.items.map((item) => {
                  const Icon = ADMIN_SECTION_ICON[item.section];
                  const active = isActiveNavPath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={
                        active
                          ? "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-[var(--gold)]/45 bg-[var(--gold)]/10 px-2 py-3 text-center"
                          : "flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-[var(--background)]/50 px-2 py-3 text-center transition active:scale-[0.98] hover:border-[var(--gold)]/30 hover:bg-white"
                      }
                    >
                      <Icon className="h-6 w-6 text-[var(--navy)]" strokeWidth={1.75} aria-hidden />
                      <span className="text-xs font-medium leading-tight text-[var(--navy)]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {showPlusExtras ? (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--graphite)]/55">
                    Actions rapides
                  </p>
                  <div className="space-y-1">
                    {ADMIN_QUICK_ACTION_GROUPS.flatMap((group) =>
                      group.actions.map((action) => (
                        <Link
                          key={action.href + action.label}
                          href={action.href}
                          onClick={onClose}
                          className="flex items-center justify-between rounded-lg px-2 py-2.5 transition hover:bg-[var(--background)]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--navy)]">{action.label}</p>
                            {action.hint ? (
                              <p className="text-xs text-[var(--graphite)]/55">{action.hint}</p>
                            ) : null}
                          </div>
                          <span className="text-xs text-[var(--graphite)]/40">{group.label}</span>
                        </Link>
                      )),
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminMobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [openTabId, setOpenTabId] = useState<AdminMobileTabId | null>(null);

  const activeTab = useMemo(() => findActiveMobileTab(pathname), [pathname]);
  const openTab = openTabId ? ADMIN_MOBILE_TABS.find((t) => t.id === openTabId) : null;

  const closeSheet = useCallback(() => setOpenTabId(null), []);

  useEffect(() => {
    closeSheet();
  }, [pathname, closeSheet]);

  function onTabPress(tab: AdminMobileTab) {
    if (tab.id === "home") {
      router.push("/admin");
      return;
    }
    setOpenTabId((prev) => (prev === tab.id ? null : tab.id));
  }

  return (
    <>
      {openTab ? <HubSheet tab={openTab} open={Boolean(openTab)} onClose={closeSheet} /> : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Navigation principale"
      >
        <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 px-1">
          {ADMIN_MOBILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = isMobileTabActive(tab, pathname) || openTabId === tab.id;
            const isHome = tab.id === "home";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabPress(tab)}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 transition ${
                  active ? "text-[var(--navy)]" : "text-[var(--graphite)]/55"
                }`}
                aria-current={active ? "page" : undefined}
                aria-expanded={!isHome && openTabId === tab.id}
              >
                {active ? (
                  <span
                    className="absolute inset-x-2 top-1 h-8 rounded-lg bg-[var(--gold)]/12"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={`relative h-5 w-5 ${active ? "text-[var(--gold)]" : ""}`}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className={`relative text-[10px] font-medium leading-none ${active ? "font-semibold" : ""}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
