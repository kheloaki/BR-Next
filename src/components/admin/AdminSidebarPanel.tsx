"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";
import { AdminSidebarProvider, useAdminSidebar } from "@/components/admin/AdminSidebarContext";
import type { AdminSection } from "@/components/admin/AdminSidebar";

function SidebarEdgeToggle() {
  const { collapsed, toggleCollapsed } = useAdminSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="absolute -right-3 top-5 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-[var(--graphite)] shadow-sm transition hover:text-[var(--navy)] lg:flex"
      aria-label={collapsed ? "Développer le menu latéral" : "Réduire le menu latéral"}
    >
      {collapsed ? (
        <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      ) : (
        <ChevronLeft className="h-3 w-3" strokeWidth={2.5} aria-hidden />
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

  return (
    <>
      <aside
        className={`relative hidden shrink-0 border-r border-border bg-[var(--admin-sidebar)] transition-[width] duration-200 ease-out lg:flex lg:flex-col ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        <SidebarEdgeToggle />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
          <div className="flex-1">
            <AdminNavLinks active={active} collapsed={collapsed} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-auto bg-[var(--admin-canvas)] px-4 py-5 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px)+0.5rem)] sm:px-6 sm:py-6 lg:px-8 lg:pb-8">
        {children}
      </main>
    </>
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
