"use client";

import { ArrowRight, Download, Linkedin, Instagram } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import heroIndustrial from "@/assets/hero-industrial.jpg";
import heroDigitalDev from "@/assets/hero-digital-dev.jpg";
import heroDigitalCode from "@/assets/hero-digital-code.jpg";
import sectorLogistics from "@/assets/sector-logistics.jpg";
import sectorEquipment from "@/assets/sector-equipment.jpg";
import type { Locale } from "@/lib/i18n";
import { usePrefersReducedMotion, useScrollProgress } from "@/components/site/motion";

const sideImages = [
  { src: heroDigitalDev, alt: "Développeurs logiciel — applications web & SaaS", position: "left" as const },
  { src: heroDigitalCode, alt: "Programmation — développement web & mobile", position: "left" as const },
  { src: sectorLogistics, alt: "Logistique industrielle", position: "right" as const },
  { src: sectorEquipment, alt: "Équipement industriel", position: "right" as const },
];

const heroBackground = heroIndustrial;

function heroCopy(locale: Locale) {
  if (locale === "en") {
    return {
      titleLine1: "BARANE",
      titleLine2: "INVEST",
      eyebrow: "Digital startup · Industry · Agadir · Morocco",
      tagline: "Build digital platforms. Power industrial projects.",
      body:
        "We develop business software, SaaS platforms, web & mobile apps, cloud and e-commerce — and we supply construction, infrastructure, logistics and industrial equipment across Morocco and Africa.",
      cta1: "Digital services",
      cta2: "Industrial catalogue",
      cta1Href: "#digital",
      cta2Href: "#catalogue",
      side: "Agadir, Morocco — Digital & B2B industry",
    };
  }
  if (locale === "es") {
    return {
      titleLine1: "BARANE",
      titleLine2: "INVEST",
      eyebrow: "Startup digital · Industria · Agadir · Marruecos",
      tagline: "Construir plataformas digitales. Impulsar proyectos industriales.",
      body:
        "Desarrollamos software de gestion, plataformas SaaS, apps web y moviles, cloud y e-commerce — y suministramos construccion, infraestructura, logistica y equipamiento industrial en Marruecos y Africa.",
      cta1: "Servicios digitales",
      cta2: "Catalogo industrial",
      cta1Href: "#digital",
      cta2Href: "#catalogue",
      side: "Agadir, Marruecos — Digital e industria B2B",
    };
  }
  return {
    titleLine1: "BARANE",
    titleLine2: "INVEST",
    eyebrow: "Startup digitale · Industrie · Agadir · Maroc",
    tagline: "Construire le digital. Piloter l'industrie.",
    body:
      "Nous développons logiciels métiers, plateformes SaaS, applications web & mobiles, cloud, IA et e-commerce — et nous fournissons construction, infrastructure, logistique et équipement industriel au Maroc et en Afrique.",
    cta1: "Services digitaux",
    cta2: "Catalogue industriel",
    cta1Href: "/services",
    cta2Href: "/catalogue",
    side: "Agadir, Maroc — Digital & industrie B2B",
  };
}

function HeroStatic({ locale }: { locale: Locale }) {
  const t = heroCopy(locale);
  const prefix = locale === "en" ? "/en" : locale === "es" ? "/es" : "";

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden bg-[var(--navy-deep)]">
      <div className="absolute inset-0">
        <Image
          src={heroBackground}
          alt="Site industriel — BARANE INVEST"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.4) 0%, oklch(0.165 0.045 263 / 0.85) 100%)",
          }}
        />
      </div>
      <div className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-28 lg:px-16 lg:pb-20">
        <p className="pointer-events-none absolute inset-x-0 top-[14%] text-center font-display uppercase leading-[0.8] tracking-tighter">
          <span className="block text-[clamp(3.5rem,24vw,16rem)] text-[var(--ivory)]">{t.titleLine1}</span>
          <span className="block text-[clamp(2.25rem,15vw,10rem)] text-[var(--gold)]">{t.titleLine2}</span>
        </p>
        <div className="mx-auto w-full max-w-[1400px]">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-[var(--gold)]" />
            <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
          </div>
          <h1 className="display-xl max-w-4xl text-4xl leading-[0.95] text-[var(--ivory)] lg:text-6xl">
            {t.tagline}
          </h1>
          <p className="mt-6 max-w-md text-[var(--ivory)]/75">{t.body}</p>
          <div className="mt-8 flex flex-wrap gap-0">
            <Button variant="gold" size="xl" asChild>
              <Link href={t.cta1Href}>
                {t.cta1} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outlineLight" size="xl" asChild>
              <Link href={t.cta2Href}>
                <Download className="h-5 w-5" /> {t.cta2}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBottomBanner({
  t,
  prefix,
  opacity,
  translateY,
  darkSurface,
}: {
  t: ReturnType<typeof heroCopy>;
  prefix: string;
  opacity: number;
  translateY: number;
  darkSurface: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-6 pb-10 pt-16 md:px-12 md:pb-14 lg:px-20 lg:pb-16"
      style={{
        opacity,
        visibility: opacity < 0.02 ? "hidden" : "visible",
        transform: `translateY(${translateY}px)`,
        background: darkSurface
          ? "linear-gradient(180deg, transparent 0%, oklch(0.165 0.045 263 / 0.55) 35%, oklch(0.165 0.045 263 / 0.92) 100%)"
          : "linear-gradient(180deg, transparent 0%, oklch(0.965 0.012 85 / 0.7) 40%, oklch(0.965 0.012 85 / 0.98) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-center gap-4 md:mb-8">
          <span className={`h-px w-12 ${darkSurface ? "bg-[var(--gold)]" : "bg-[var(--navy)]/30"}`} />
          <span className={`eyebrow ${darkSurface ? "text-[var(--gold)]" : "text-[var(--navy)]"}`}>
            {t.eyebrow}
          </span>
          <span className={`h-px w-12 ${darkSurface ? "bg-[var(--gold)]" : "bg-[var(--navy)]/30"}`} />
        </div>

        <p
          className={`mx-auto max-w-3xl text-center text-2xl font-medium leading-snug md:text-3xl lg:text-[2.35rem] lg:leading-[1.15] ${
            darkSurface ? "text-[var(--ivory)]" : "text-[var(--navy)]"
          }`}
        >
          {t.tagline}
        </p>

        <p
          className={`mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed md:text-base ${
            darkSurface ? "text-[var(--ivory)]/70" : "text-[var(--graphite)]"
          }`}
        >
          {t.body}
        </p>

        <div className="pointer-events-auto mx-auto mt-8 flex max-w-xl flex-col items-stretch justify-center gap-0 sm:flex-row sm:items-center">
          <Button variant="gold" size="xl" className="w-full sm:w-auto" asChild>
            <Link href={t.cta1Href}>
              {t.cta1} <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant={darkSurface ? "outlineLight" : "outlineNavy"}
            size="xl"
            className="w-full sm:w-auto"
            asChild
          >
            <Link href={t.cta2Href}>
              <Download className="h-5 w-5" /> {t.cta2}
            </Link>
          </Button>
        </div>

        <p
          className={`mt-8 text-center eyebrow ${
            darkSurface ? "text-[var(--ivory)]/45" : "text-[var(--navy)]/45"
          }`}
        >
          {t.side}
        </p>
      </div>
    </div>
  );
}

function HeroScroll({ locale }: { locale: Locale }) {
  const t = heroCopy(locale);
  const prefix = locale === "en" ? "/en" : locale === "es" ? "/es" : "";
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgress = useScrollProgress(sectionRef, 2);

  const textOpacity = Math.max(0, 1 - scrollProgress / 0.22);
  const bannerTranslateY = scrollProgress * 56;
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));

  const sideWidth = imageProgress * 40;
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + imageProgress * 100;
  const sideTranslateRight = 100 - imageProgress * 100;
  const gap = imageProgress * 6;

  const titleTranslateY = -scrollProgress * 10 - imageProgress * 6;
  const titleScale = 1 - scrollProgress * 0.04 - imageProgress * 0.02;

  return (
    <section id="hero" ref={sectionRef} className="relative bg-[var(--navy-deep)]">
      <div className="relative sticky top-0 h-[100svh] overflow-hidden bg-[var(--navy-deep)]">
        <div className="absolute inset-0 z-10">
          <Image
            src={heroBackground}
            alt="Site industriel — BARANE INVEST"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, oklch(0.165 0.045 263 / 0.35) 0%, oklch(0.165 0.045 263 / ${0.55 + imageProgress * 0.35}) 100%)`,
            }}
          />
        </div>

        <div className="absolute inset-0 z-[4] bg-topo opacity-[0.06] mix-blend-screen pointer-events-none" />

        <div
          className="absolute inset-0 z-20 flex items-stretch will-change-transform"
          style={{ gap: `${gap}px` }}
        >
          <div
            className="flex h-full min-w-0 flex-row overflow-hidden"
            style={{
              width: `${sideWidth}%`,
              gap: `${gap}px`,
              transform: `translateX(${sideTranslateLeft}%)`,
              opacity: sideOpacity,
            }}
          >
            {sideImages
              .filter((img) => img.position === "left")
              .map((img) => (
                <SideImage key={img.alt} img={img.src} alt={img.alt} />
              ))}
          </div>
          <div className="min-w-0 flex-1" aria-hidden />
          <div
            className="flex h-full min-w-0 flex-row overflow-hidden"
            style={{
              width: `${sideWidth}%`,
              gap: `${gap}px`,
              transform: `translateX(${sideTranslateRight}%)`,
              opacity: sideOpacity,
            }}
          >
            {sideImages
              .filter((img) => img.position === "right")
              .map((img) => (
                <SideImage key={img.alt} img={img.src} alt={img.alt} />
              ))}
          </div>
        </div>

        <div
          className="absolute inset-x-0 z-50 flex justify-center pointer-events-none px-3"
          style={{
            top: "max(4.5rem, 8vh)",
            opacity: textOpacity,
            transform: `translateY(${titleTranslateY}vh) scale(${titleScale})`,
          }}
        >
          <h1 className="select-none text-center font-display uppercase leading-[0.75] tracking-[-0.04em]">
            <span
              className="block text-[clamp(4rem,26vw,18rem)] text-[var(--ivory)]"
              style={{
                textShadow:
                  "0 4px 48px oklch(0.165 0.045 263 / 0.95), 0 2px 0 oklch(0.225 0.058 263)",
              }}
            >
              {t.titleLine1}
            </span>
            <span
              className="block text-[clamp(2.5rem,16vw,11rem)] text-[var(--gold)]"
              style={{ textShadow: "0 6px 40px oklch(0.165 0.045 263 / 0.9)" }}
            >
              {t.titleLine2}
            </span>
          </h1>
        </div>

        <div
          className="absolute bottom-28 left-6 z-[60] hidden lg:flex flex-col gap-4 pointer-events-auto"
          style={{ opacity: Math.max(0, textOpacity - 0.2) }}
        >
          <a
            href="https://www.linkedin.com/company/baraneinvest"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-[var(--ivory)]/50 hover:text-[var(--gold)]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className="text-[var(--ivory)]/50 hover:text-[var(--gold)]"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>

        <HeroBottomBanner
          t={t}
          prefix={prefix}
          opacity={textOpacity}
          translateY={bannerTranslateY}
          darkSurface={true}
        />
      </div>

      <div className="h-[200vh]" aria-hidden />
    </section>
  );
}

function SideImage({ img, alt }: { img: StaticImageData; alt: string }) {
  return (
    <div className="relative h-full flex-1 overflow-hidden">
      <Image src={img} alt={alt} fill sizes="25vw" className="object-cover" />
    </div>
  );
}

export function Hero({ locale = "fr" }: { locale?: Locale }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <HeroStatic locale={locale} />;
  return <HeroScroll locale={locale} />;
}
