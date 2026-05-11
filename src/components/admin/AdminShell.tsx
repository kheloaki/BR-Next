import type { ReactNode } from "react";
import { AdminSidebar, type AdminSection } from "@/components/admin/AdminSidebar";

export function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#f7f7f7] min-h-screen p-4 lg:p-5">
      <div className="w-full grid lg:grid-cols-[260px_1fr] gap-5 items-start">
        <AdminSidebar active={active} />
        <main className="border border-border bg-white p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
