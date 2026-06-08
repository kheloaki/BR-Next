import type { ReactNode } from "react";
import { AdminMobileChrome } from "@/components/admin/AdminMobileChrome";
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
      <div className="min-h-screen bg-[var(--background)]">
        <AdminMobileChrome active={active} />
        <AdminSidebarPanel active={active}>{children}</AdminSidebarPanel>
        <AdminQuickActionsFab />
      </div>
    </ConfirmDeleteProvider>
  );
}
