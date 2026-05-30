"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";
import type { AdminSection } from "@/components/admin/AdminSidebar";

export function AdminMobileChrome({ active }: { active: AdminSection }) {
  const [open, setOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = fullName || email || "Administrateur";
  const initial = (fullName || email || "A").charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-[var(--navy)] hover:bg-[var(--background)]"
        >
          <span className="sr-only">Menu</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Image src={logoFooter} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--navy)]">BARANE INVEST</p>
            <p className="truncate text-[11px] text-[var(--graphite)]/70">Administration</p>
          </div>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100%,288px)] flex-col border-r border-border bg-[var(--background)] p-4 shadow-xl transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 px-1 pb-4">
          <Image src={logoFooter} alt="BARANE INVEST" width={26} height={26} className="h-6 w-6 object-contain" />
          <div>
            <p className="text-sm font-semibold leading-none text-[var(--navy)]">BARANE</p>
            <p className="mt-0.5 text-[11px] leading-none text-[var(--graphite)]/70">INVEST</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AdminNavLinks active={active} collapsed={false} onNavigate={() => setOpen(false)} />
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-sm font-semibold text-[var(--navy)]">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--navy)]">{name}</p>
            {email ? (
              <p className="truncate text-xs text-[var(--graphite)]/70">{email}</p>
            ) : (
              <p className="truncate text-xs text-[var(--graphite)]/70">Compte administrateur</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
