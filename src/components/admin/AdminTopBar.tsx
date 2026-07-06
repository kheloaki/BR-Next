"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ChevronDown, CircleHelp, LayoutGrid } from "lucide-react";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { badgeSm, pillButton } from "@/components/admin/admin-form-styles";

export function AdminTopBar() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "Compte administrateur";
  const initial = (user?.firstName?.[0] ?? user?.lastName?.[0] ?? email[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-50 hidden h-[var(--admin-topbar-h)] shrink-0 items-center justify-between border-b border-border/80 bg-white/95 px-5 backdrop-blur-sm lg:flex lg:rounded-t-[var(--admin-radius-xl)]">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/admin" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius-sm)] bg-[var(--navy-deep)]">
          <Image src={logoFooter} alt="BARANE INVEST" width={18} height={18} className="h-4 w-4 object-contain brightness-0 invert" />
        </Link>

        <span className="text-[var(--graphite)]/40" aria-hidden>
          /
        </span>

        <button
          type="button"
          className={`${pillButton} max-w-[240px]`}
          title={email}
        >
          <span className={badgeSm}>Compte</span>
          <span className="truncate">{email}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--graphite)]" aria-hidden />
        </button>

        <span className="text-[var(--graphite)]/40" aria-hidden>
          /
        </span>

        <button type="button" className={pillButton}>
          <LayoutGrid className="h-3.5 w-3.5 text-[var(--graphite)]" aria-hidden />
          <span>BARANE INVEST</span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--graphite)]" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-[var(--admin-radius-pill)] border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          Tout OK
        </div>

        <Link
          href="/admin/referentiel"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--admin-radius-md)] text-[var(--graphite)] transition hover:bg-[var(--muted)] hover:text-[var(--navy)]"
          aria-label="Aide et référentiel"
        >
          <CircleHelp className="h-4 w-4" strokeWidth={1.75} />
        </Link>

        <Link
          href="/admin/utilisateurs"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--muted)] text-xs font-semibold text-[var(--navy)] transition hover:ring-2 hover:ring-[var(--admin-accent)]/20"
          title={email}
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
