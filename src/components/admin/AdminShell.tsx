import type { ReactNode } from "react";
import { Suspense } from "react";
import { AdminContentBack } from "@/components/admin/AdminContentBack";
import { AdminMobileBottomNav } from "@/components/admin/AdminMobileBottomNav";
import { AdminMobileChrome } from "@/components/admin/AdminMobileChrome";
import { AdminNavHistoryProvider } from "@/components/admin/AdminNavHistoryProvider";
import { AdminQuickActionsFab } from "@/components/admin/AdminQuickActionsFab";
import { AdminSidebarPanel } from "@/components/admin/AdminSidebarPanel";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
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
          <div className="flex min-h-screen flex-col bg-[var(--background)] lg:bg-[var(--admin-shell-bg)] lg:p-3" data-admin>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:rounded-[var(--admin-radius-xl)] lg:border lg:border-border/70 lg:bg-[var(--background)] lg:shadow-[var(--admin-shadow-shell)]">
            <AdminTopBar />
            <AdminMobileChrome active={active} />
            <div className="flex min-h-0 flex-1">
              <AdminSidebarPanel active={active}>
                <AdminContentBack />
                {children}
              </AdminSidebarPanel>
            </div>
            </div>
            <AdminMobileBottomNav />
            <AdminQuickActionsFab />
          </div>
        </AdminNavHistoryProvider>
      </Suspense>
    </ConfirmDeleteProvider>
  );
}
