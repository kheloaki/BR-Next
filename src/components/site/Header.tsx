"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/barane-logo-horizontal-transparent.png";

const nav = [
  { key: "activities", href: "/activites" },
  { key: "services", href: "/services" },
  { key: "catalogue", href: "/catalogue" },
  { key: "sectors", href: "/secteurs" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
];

function stripLocalePrefix(pathname: string) {
  if (pathname === "/en" || pathname === "/fr" || pathname === "/es") {
    return "/";
  }
  if (pathname.startsWith("/en/")) {
    return pathname.slice(3);
  }
  if (pathname.startsWith("/es/")) {
    return pathname.slice(3);
  }
  if (pathname.startsWith("/fr/")) {
    return pathname.slice(3);
  }
  return pathname;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const isSpanish = pathname === "/es" || pathname.startsWith("/es/");
  const isFrenchPrefixed = pathname === "/fr" || pathname.startsWith("/fr/");
  const cleanPath = stripLocalePrefix(pathname);
  const localePrefix = isEnglish ? "/en" : isSpanish ? "/es" : isFrenchPrefixed ? "/fr" : "";
  const localizeHref = (href: string) => {
    if (href === "/") {
      return localePrefix || "/";
    }
    return `${localePrefix}${href}`;
  };
  const labels = isEnglish
    ? {
        activities: "Activities",
        services: "Services",
        catalogue: "Catalogue",
        sectors: "Sectors",
        about: "About",
        contact: "Contact",
        proposal: "Service Proposal",
        quote: "Request a quote",
      }
    : isSpanish
      ? {
          activities: "Actividades",
          services: "Servicios",
          catalogue: "Catalogo",
          sectors: "Sectores",
          about: "Nosotros",
          contact: "Contacto",
          proposal: "Propuesta de servicio",
          quote: "Solicitar cotizacion",
        }
      : {
          activities: "Activités",
          services: "Services",
          catalogue: "Catalogue",
          sectors: "Secteurs",
          about: "À propos",
          contact: "Contact",
          proposal: "Service Proposal",
          quote: "Demander un devis",
        };
  const currentLocaleLabel = isEnglish ? "EN" : isSpanish ? "ES" : "FR";

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border bg-[var(--ivory)]">
      <div className="grid grid-cols-12 items-center h-16 lg:h-[72px]">
        {/* Logo block — mirrors reference left-anchored logo */}
        <Link
          href={localizeHref("/")}
          className="col-span-5 lg:col-span-2 flex items-center h-full px-2 lg:px-1.5 text-[var(--navy)]"
        >
          <div className="h-full flex items-center pr-2 border-r border-border">
            <Image
              src={logoHeader}
              alt="BARANE INVEST"
              width={240}
              height={64}
              className="h-14 lg:h-16 w-auto object-contain"
            />
          </div>
        </Link>

        <nav className="hidden lg:flex col-span-7 items-center justify-center gap-11 px-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localizeHref(item.href)}
              className={`group flex items-baseline gap-1 text-[0.85rem] font-semibold tracking-[0.07em] uppercase transition-colors ${
                cleanPath === item.href ? "text-[var(--navy)]" : "text-[var(--graphite)]/80"
              } hover:text-[var(--gold)]`}
            >
              <span>{labels[item.key as keyof typeof labels]}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex col-span-3 h-full border-l border-border">
          <div className="w-1/3 h-full border-r border-border relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="w-full h-full flex items-center justify-center gap-1 text-[0.8rem] font-semibold tracking-[0.06em] uppercase text-[var(--navy)]"
              aria-label="Language selector"
              aria-expanded={langOpen}
            >
              {currentLocaleLabel} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <div className="absolute top-full left-0 right-0 bg-[var(--ivory)] border border-border z-50">
                <Link
                  href={`/fr${cleanPath === "/" ? "" : cleanPath}`}
                  className={`block px-4 py-2 text-xs font-semibold tracking-[0.06em] uppercase hover:bg-[var(--navy)]/5 ${
                    !isEnglish && !isSpanish ? "text-[var(--navy)]" : "text-[var(--graphite)]/70"
                  }`}
                  onClick={() => setLangOpen(false)}
                >
                  FR
                </Link>
                <Link
                  href={`/en${cleanPath === "/" ? "" : cleanPath}`}
                  className={`block px-4 py-2 text-xs font-semibold tracking-[0.06em] uppercase hover:bg-[var(--navy)]/5 ${
                    isEnglish ? "text-[var(--navy)]" : "text-[var(--graphite)]/70"
                  }`}
                  onClick={() => setLangOpen(false)}
                >
                  EN
                </Link>
                <Link
                  href={`/es${cleanPath === "/" ? "" : cleanPath}`}
                  className={`block px-4 py-2 text-xs font-semibold tracking-[0.06em] uppercase hover:bg-[var(--navy)]/5 ${
                    isSpanish ? "text-[var(--navy)]" : "text-[var(--graphite)]/70"
                  }`}
                  onClick={() => setLangOpen(false)}
                >
                  ES
                </Link>
              </div>
            )}
          </div>
          <Button variant="gold" size="xl" className="w-2/3 h-full rounded-none border-0" asChild>
            <Link href={localizeHref("/contact")} className="text-[0.8rem] tracking-[0.06em] uppercase">
              {labels.proposal}
            </Link>
          </Button>
        </div>

        <div className="lg:hidden col-span-7 flex justify-end h-full">
          <button
            className="h-full px-6 flex items-center text-[var(--navy)]"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-[var(--navy-deep)] px-6 py-8 space-y-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={localizeHref(item.href)}
              onClick={() => setOpen(false)}
              className="flex items-baseline text-[var(--ivory)] font-display text-2xl uppercase tracking-tight"
            >
              {labels[item.key as keyof typeof labels]}
            </Link>
          ))}
          <div className="flex items-center gap-4 text-sm text-[var(--ivory)]/70">
            <Link href={`/fr${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              Français
            </Link>
            <Link href={`/en${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              English
            </Link>
            <Link href={`/es${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              Espanol
            </Link>
          </div>
          <Button variant="gold" className="w-full" asChild>
            <Link href={localizeHref("/contact")} onClick={() => setOpen(false)}>
              {labels.quote}
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
