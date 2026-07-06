"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/barane-logo-horizontal-transparent.png";

type NavItem = {
  key: string;
  anchor: string;
  /** Hide below xl to keep the bar readable on laptop widths */
  xlOnly?: boolean;
};

/** Landing-page nav — all items scroll to homepage sections */
const nav: NavItem[] = [
  { key: "services", anchor: "#digital" },
  { key: "solutions", anchor: "#solutions" },
  { key: "activities", anchor: "#activites" },
  { key: "catalogue", anchor: "#catalogue" },
  { key: "sectors", anchor: "#secteurs", xlOnly: true },
  { key: "projects", anchor: "#projets", xlOnly: true },
  { key: "about", anchor: "#about" },
  { key: "contact", anchor: "#contact" },
];

function stripLocalePrefix(pathname: string) {
  if (pathname === "/en" || pathname === "/fr" || pathname === "/es") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  if (pathname.startsWith("/es/")) return pathname.slice(3);
  if (pathname.startsWith("/fr/")) return pathname.slice(3);
  return pathname;
}

function isHomePath(cleanPath: string) {
  return cleanPath === "/" || cleanPath === "";
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hash, setHash] = useState("");
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const isSpanish = pathname === "/es" || pathname.startsWith("/es/");
  const isFrenchPrefixed = pathname === "/fr" || pathname.startsWith("/fr/");
  const cleanPath = stripLocalePrefix(pathname);
  const onHome = isHomePath(cleanPath);
  const localePrefix = isEnglish ? "/en" : isSpanish ? "/es" : isFrenchPrefixed ? "/fr" : "";
  const homeUrl = localePrefix || "/";

  function localizeHref(href: string) {
    if (href === "/") return homeUrl;
    return `${localePrefix}${href}`;
  }

  const sectionHref = (anchor: string) => (onHome ? anchor : `${homeUrl}${anchor}`);

  const langHref = (locale: "fr" | "en" | "es") => {
    const prefix = locale === "fr" ? "/fr" : locale === "en" ? "/en" : "/es";
    if (onHome) {
      const suffix = hash || "";
      return locale === "fr" && !isFrenchPrefixed ? `/${suffix}` : `${prefix}${suffix}`;
    }
    const path = cleanPath === "/" ? "" : cleanPath;
    return `${prefix}${path}`;
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!langOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [langOpen]);

  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  const labels = isEnglish
    ? {
        services: "Services",
        solutions: "Solutions",
        activities: "Activities",
        catalogue: "Catalogue",
        sectors: "Sectors",
        projects: "Projects",
        about: "About",
        contact: "Contact",
        quote: "Request a quote",
        quoteShort: "Quote",
      }
    : isSpanish
      ? {
          services: "Servicios",
          solutions: "Soluciones",
          activities: "Actividades",
          catalogue: "Catalogo",
          sectors: "Sectores",
          projects: "Proyectos",
          about: "Nosotros",
          contact: "Contacto",
          quote: "Solicitar cotizacion",
          quoteShort: "Cotizar",
        }
      : {
          services: "Services",
          solutions: "Solutions",
          activities: "Activités",
          catalogue: "Catalogue",
          sectors: "Secteurs",
          projects: "Réalisations",
          about: "À propos",
          contact: "Contact",
          quote: "Demander un devis",
          quoteShort: "Devis",
        };

  const currentLocaleLabel = isEnglish ? "EN" : isSpanish ? "ES" : "FR";
  const quoteLabel = isScrolled ? labels.quoteShort : labels.quote;

  const isNavActive = (item: NavItem) => onHome && hash === item.anchor;

  const linkClass = (active: boolean) =>
    `text-[0.62rem] xl:text-[0.68rem] font-semibold tracking-[0.05em] uppercase transition-colors whitespace-nowrap ${
      isScrolled
        ? active
          ? "text-[var(--gold)]"
          : "text-[var(--ivory)]/75 hover:text-[var(--gold)]"
        : active
          ? "text-[var(--navy)]"
          : "text-[var(--graphite)]/80 hover:text-[var(--gold)]"
    }`;

  return (
    <header
      className={`fixed z-50 transition-all duration-300 ${
        isScrolled
          ? "top-3 left-1/2 w-[min(96vw,88rem)] -translate-x-1/2 px-1"
          : "top-0 inset-x-0 w-full"
      }`}
    >
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          isScrolled
            ? "h-14 rounded-full border border-[var(--gold)]/25 bg-[var(--navy-deep)]/92 backdrop-blur-md px-3 lg:px-4 shadow-lg"
            : "h-16 lg:h-[72px] border-b border-border bg-[var(--ivory)] px-3 lg:px-6"
        }`}
      >
        <Link
          href={homeUrl}
          className={`flex shrink-0 items-center ${isScrolled ? "pl-1" : "h-full"}`}
        >
          <Image
            src={logoHeader}
            alt="BARANE INVEST"
            width={200}
            height={52}
            priority
            className={`w-auto object-contain transition-all ${
              isScrolled ? "h-8 lg:h-9 brightness-0 invert" : "h-11 lg:h-14"
            }`}
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex xl:gap-3.5 2xl:gap-5">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={sectionHref(item.anchor)}
              className={`${linkClass(isNavActive(item))} ${item.xlOnly ? "hidden xl:inline" : ""}`}
            >
              {labels[item.key as keyof typeof labels]}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 lg:flex lg:gap-2">
          <div ref={langRef} className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-2 text-[0.68rem] font-semibold tracking-[0.05em] uppercase ${
                isScrolled ? "text-[var(--ivory)] hover:text-[var(--gold)]" : "text-[var(--navy)] hover:text-[var(--gold)]"
              }`}
              aria-expanded={langOpen}
              aria-label="Language"
            >
              {currentLocaleLabel} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 min-w-[5rem] overflow-hidden rounded-md border border-border bg-[var(--ivory)] shadow-md">
                <Link
                  href={langHref("fr")}
                  className="block px-4 py-2 text-xs font-semibold uppercase hover:bg-[var(--navy)]/5"
                  onClick={() => setLangOpen(false)}
                >
                  FR
                </Link>
                <Link
                  href={langHref("en")}
                  className="block px-4 py-2 text-xs font-semibold uppercase hover:bg-[var(--navy)]/5"
                  onClick={() => setLangOpen(false)}
                >
                  EN
                </Link>
                <Link
                  href={langHref("es")}
                  className="block px-4 py-2 text-xs font-semibold uppercase hover:bg-[var(--navy)]/5"
                  onClick={() => setLangOpen(false)}
                >
                  ES
                </Link>
              </div>
            )}
          </div>
          <Button
            variant="gold"
            size="sm"
            className={`shrink-0 whitespace-nowrap rounded-full px-4 tracking-[0.1em] ${
              isScrolled ? "h-9 text-[0.62rem]" : "h-11 px-6 text-[0.68rem] lg:h-12"
            }`}
            asChild
          >
            <Link href={sectionHref("#contact")}>{quoteLabel}</Link>
          </Button>
        </div>

        <button
          type="button"
          className={`ml-auto p-2.5 lg:hidden ${isScrolled ? "text-[var(--ivory)]" : "text-[var(--navy)]"}`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="mx-2 mt-2 space-y-5 rounded-lg border border-[var(--gold)]/20 bg-[var(--navy-deep)] px-6 py-8 shadow-xl lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.key}
              href={sectionHref(item.anchor)}
              onClick={() => setOpen(false)}
              className={`block font-display text-2xl uppercase tracking-tight ${
                isNavActive(item) ? "text-[var(--gold)]" : "text-[var(--ivory)]"
              }`}
            >
              {labels[item.key as keyof typeof labels]}
            </Link>
          ))}
          <div className="flex gap-4 text-sm text-[var(--ivory)]/70">
            <Link href={langHref("fr")} onClick={() => setOpen(false)}>
              FR
            </Link>
            <Link href={langHref("en")} onClick={() => setOpen(false)}>
              EN
            </Link>
            <Link href={langHref("es")} onClick={() => setOpen(false)}>
              ES
            </Link>
          </div>
          <Button variant="gold" className="w-full" asChild>
            <Link href={sectionHref("#contact")} onClick={() => setOpen(false)}>
              {labels.quote}
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
