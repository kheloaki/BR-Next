"use client";

import { usePathname } from "next/navigation";
import { AdminBackLink } from "@/components/admin/ux/AdminBackLink";

export function AdminContentBack() {
  const pathname = usePathname();
  if (!pathname.startsWith("/admin") || pathname === "/admin") return null;

  return (
    <div className="mb-3 hidden lg:block">
      <AdminBackLink />
    </div>
  );
}
