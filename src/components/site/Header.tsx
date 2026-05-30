"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoHeader from "@/assets/barane-logo-horizontal-transparent.png";

const nav = [
  { key: "activities", href: "/activites", anchor: "#activites" },
  { key: "catalogue", href: "/catalogue", anchor: "#catalogue" },
  { key: "sectors", href: "/secteurs", anchor: "#secteurs" },
  { key: "projects", href: "/projets", anchor: "#projets" },
  { key: "about", href: "/about", anchor: "#about" },
  { key: "contact", href: "/contact", anchor: "#contact" },
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
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const isSpanish = pathname === "/es" || pathname.startsWith("/es/");
  const isFrenchPrefixed = pathname === "/fr" || pathname.startsWith("/fr/");
  const cleanPath = stripLocalePrefix(pathname);
  const onHome = isHomePath(cleanPath);
  const localePrefix = isEnglish ? "/en" : isSpanish ? "/es" : isFrenchPrefixed ? "/fr" : "";

  const localizeHref = (href: string) => {
    if (href === "/") return localePrefix || "/";
    return `${localePrefix}${href}`;
  };

  const navHref = (item: (typeof nav)[0]) => {
    if (item.anchor) {
      return onHome ? item.anchor : `${localizeHref("/")}${item.anchor}`;
    }
    return localizeHref(item.href);
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const labels = isEnglish
    ? {
        activities: "Activities",
        catalogue: "Catalogue",
        sectors: "Sectors",
        projects: "Projects",
        about: "About",
        contact: "Contact",
        quote: "Request a quote",
      }
    : isSpanish
      ? {
          activities: "Actividades",
          catalogue: "Catalogo",
          sectors: "Sectores",
          projects: "Proyectos",
          about: "Nosotros",
          contact: "Contacto",
          quote: "Solicitar cotizacion",
        }
      : {
          activities: "Activités",
          catalogue: "Catalogue",
          sectors: "Secteurs",
          projects: "Réalisations",
          about: "À propos",
          contact: "Contact",
          quote: "Demander un devis",
        };

  const currentLocaleLabel = isEnglish ? "EN" : isSpanish ? "ES" : "FR";

  return (
    <header
      className={`fixed z-50 transition-all duration-300 ${
        isScrolled
          ? "top-3 left-1/2 w-[94%] max-w-5xl -translate-x-1/2"
          : "top-0 inset-x-0 w-full"
      }`}
    >
      <div
        className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled
            ? "rounded-full border border-[var(--gold)]/25 bg-[var(--navy-deep)]/90 backdrop-blur-md px-3 py-2 shadow-lg"
            : "h-16 lg:h-[72px] border-b border-border bg-[var(--ivory)] px-2 lg:px-4"
        }`}
      >
        <Link
          href={localizeHref("/")}
          className={`flex items-center shrink-0 ${isScrolled ? "pl-2" : "h-full px-2 lg:px-1"}`}
        >
          <Image
            src={logoHeader}
            alt="BARANE INVEST"
            width={200}
            height={52}
            className={`w-auto object-contain transition-all ${
              isScrolled ? "h-9" : "h-12 lg:h-14"
            } ${isScrolled ? "brightness-0 invert" : ""}`}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 px-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={navHref(item)}
              className={`text-[0.72rem] font-semibold tracking-[0.08em] uppercase transition-colors ${
                isScrolled
                  ? cleanPath === item.href
                    ? "text-[var(--gold)]"
                    : "text-[var(--ivory)]/75 hover:text-[var(--gold)]"
                  : cleanPath === item.href
                    ? "text-[var(--navy)]"
                    : "text-[var(--graphite)]/80 hover:text-[var(--gold)]"
              }`}
            >
              {labels[item.key as keyof typeof labels]}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className={`flex items-center gap-1 px-3 py-2 text-[0.72rem] font-semibold tracking-[0.06em] uppercase ${
                isScrolled ? "text-[var(--ivory)]" : "text-[var(--navy)]"
              }`}
              aria-expanded={langOpen}
              aria-label="Language"
            >
              {currentLocaleLabel} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-1 min-w-[5rem] border border-border bg-[var(--ivory)] z-50 shadow-md">
                <Link
                  href={`/fr${cleanPath === "/" ? "" : cleanPath}`}
                  className="block px-4 py-2 text-xs font-semibold uppercase hover:bg-[var(--navy)]/5"
                  onClick={() => setLangOpen(false)}
                >
                  FR
                </Link>
                <Link
                  href={`/en${cleanPath === "/" ? "" : cleanPath}`}
                  className="block px-4 py-2 text-xs font-semibold uppercase hover:bg-[var(--navy)]/5"
                  onClick={() => setLangOpen(false)}
                >
                  EN
                </Link>
                <Link
                  href={`/es${cleanPath === "/" ? "" : cleanPath}`}
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
            size={isScrolled ? "default" : "lg"}
            className={isScrolled ? "rounded-full px-5" : "rounded-none"}
            asChild
          >
            <Link href={onHome ? "#contact" : localizeHref("/contact")}>{labels.quote}</Link>
          </Button>
        </div>

        <button
          type="button"
          className={`lg:hidden p-3 ${isScrolled ? "text-[var(--ivory)]" : "text-[var(--navy)]"}`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-2 mx-2 rounded-lg border border-[var(--gold)]/20 bg-[var(--navy-deep)] px-6 py-8 space-y-5 shadow-xl">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={navHref(item)}
              onClick={() => setOpen(false)}
              className="block font-display text-2xl uppercase tracking-tight text-[var(--ivory)]"
            >
              {labels[item.key as keyof typeof labels]}
            </Link>
          ))}
          <div className="flex gap-4 text-sm text-[var(--ivory)]/70">
            <Link href={`/fr${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              FR
            </Link>
            <Link href={`/en${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              EN
            </Link>
            <Link href={`/es${cleanPath === "/" ? "" : cleanPath}`} onClick={() => setOpen(false)}>
              ES
            </Link>
          </div>
          <Button variant="gold" className="w-full" asChild>
            <Link href={onHome ? "#contact" : localizeHref("/contact")} onClick={() => setOpen(false)}>
              {labels.quote}
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
}
