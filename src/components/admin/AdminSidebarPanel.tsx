"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";
import { AdminSidebarProvider, useAdminSidebar } from "@/components/admin/AdminSidebarContext";
import type { AdminSection } from "@/components/admin/AdminSidebar";

function SidebarCollapseControl() {
  const { collapsed, toggleCollapsed } = useAdminSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-[var(--graphite)]/80 shadow-sm transition hover:border-[var(--gold)]/50 hover:text-[var(--navy)]"
      aria-label={collapsed ? "Développer le menu latéral" : "Réduire le menu latéral"}
      title={collapsed ? "Développer le menu" : "Réduire le menu"}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      ) : (
        <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

function SidebarEdgeToggle() {
  const { collapsed, toggleCollapsed } = useAdminSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="absolute -right-3 top-[4.5rem] z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-[var(--graphite)] shadow-md transition hover:border-[var(--gold)]/50 hover:text-[var(--navy)] lg:flex"
      aria-label={collapsed ? "Développer le menu latéral" : "Réduire le menu latéral"}
    >
      {collapsed ? (
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      ) : (
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      )}
    </button>
  );
}

function AdminSidebarPanelInner({
  active,
  children,
}: {
  active: AdminSection;
  children: ReactNode;
}) {
  const { collapsed } = useAdminSidebar();
  const { user } = useUser();

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = fullName || email || "Administrateur";
  const initial = (fullName || email || "A").charAt(0).toUpperCase();

  return (
    <div className="flex w-full min-h-[calc(100dvh-3.5rem)] lg:min-h-screen">
      <aside
        className={`relative hidden shrink-0 border-r border-border bg-[var(--background)] transition-[width] duration-200 ease-out lg:block ${
          collapsed ? "w-[76px]" : "w-[268px]"
        }`}
      >
        <SidebarEdgeToggle />

        <div className="flex h-full min-h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto p-3 lg:min-h-screen lg:p-4">
          <div
            className={`flex items-center gap-2 ${collapsed ? "flex-col justify-center gap-2" : "justify-between"}`}
          >
            <div
              className={`flex min-w-0 items-center gap-2 ${collapsed ? "justify-center" : ""}`}
              title="BARANE INVEST"
            >
              <Image src={logoFooter} alt="BARANE INVEST" width={26} height={26} className="h-6 w-6 object-contain" />
              {!collapsed ? (
                <div>
                  <p className="text-sm font-semibold leading-none text-[var(--navy)]">BARANE</p>
                  <p className="mt-0.5 text-[11px] leading-none text-[var(--graphite)]/70">INVEST</p>
                </div>
              ) : null}
            </div>
            {!collapsed ? <SidebarCollapseControl /> : null}
          </div>

          <div className="mt-5 flex-1">
            <AdminNavLinks active={active} collapsed={collapsed} />
          </div>

          <div
            className={`mt-4 flex items-center gap-3 rounded-lg border border-border bg-white ${
              collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
            }`}
            title={collapsed ? `${name}${email ? ` · ${email}` : ""}` : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-sm font-semibold text-[var(--navy)]">
              {initial}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--navy)]">{name}</p>
                {email ? (
                  <p className="truncate text-xs text-[var(--graphite)]/70">{email}</p>
                ) : (
                  <p className="truncate text-xs text-[var(--graphite)]/70">Compte administrateur</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">{children}</main>
    </div>
  );
}

export function AdminSidebarPanel({
  active,
  children,
}: {
  active: AdminSection;
  children: ReactNode;
}) {
  return (
    <AdminSidebarProvider>
      <AdminSidebarPanelInner active={active}>{children}</AdminSidebarPanelInner>
    </AdminSidebarProvider>
  );
}
