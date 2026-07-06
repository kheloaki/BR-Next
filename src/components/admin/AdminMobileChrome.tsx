"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { AdminBackLink } from "@/components/admin/ux/AdminBackLink";
import { getMobilePageTitle } from "@/lib/admin/admin-mobile-nav";
import type { AdminSection } from "@/components/admin/AdminSidebar";

export function AdminMobileChrome({ active: _active }: { active: AdminSection }) {
  const pathname = usePathname();
  const pageTitle = getMobilePageTitle(pathname);
  const showBack = pathname.startsWith("/admin") && pathname !== "/admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        {showBack ? (
          <AdminBackLink
            showIcon
            label=""
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--admin-radius-md)] text-[var(--navy)] hover:bg-[var(--muted)]"
            aria-label="Retour"
          />
        ) : null}
        <Image src={logoFooter} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-[var(--graphite)]">
            BARANE INVEST
          </p>
          <p className="truncate text-base font-semibold leading-tight text-[var(--navy)]">{pageTitle}</p>
        </div>
      </div>
    </header>
  );
}
