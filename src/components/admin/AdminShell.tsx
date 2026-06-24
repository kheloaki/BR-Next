import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminContentBack } from "@/components/admin/AdminContentBack";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";
import { AdminMobileChrome } from "@/components/admin/AdminMobileChrome";
import { AdminNavHistoryProvider } from "@/components/admin/AdminNavHistoryProvider";
import { AdminQuickActionsFab } from "@/components/admin/AdminQuickActionsFab";
import { AdminSidebarPanel } from "@/components/admin/AdminSidebarPanel";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import { ConfirmDeleteProvider } from "@/components/admin/ux/ConfirmDeleteProvider";

export function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: ReactNode;
}) {
  return (
    <ConfirmDeleteProvider>
      <Suspense fallback={null}>
        <AdminNavHistoryProvider>
          <div className="min-h-screen bg-[var(--background)]">
            <AdminMobileChrome active={active} />
            <AdminSidebarPanel active={active}>
              <AdminContentBack />
              {children}
            </AdminSidebarPanel>
            <AdminMobileBottomNav />
            <AdminQuickActionsFab />
          </div>
        </AdminNavHistoryProvider>
      </Suspense>
    </ConfirmDeleteProvider>
  );
}
