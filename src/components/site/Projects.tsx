"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import sectorMining from "@/assets/sector-mining.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import digitalSoftware from "@/assets/digital-software.jpg";
import digitalCloud from "@/assets/digital-cloud.jpg";
import digitalMarketing from "@/assets/digital-marketing.jpg";
import type { Locale } from "@/lib/i18n";
import { usePrefersReducedMotion, useScrollProgress } from "@/components/site/motion";

type Project = { img: StaticImageData; tag: string; title: string; location: string };

function projectsData(locale: Locale): Project[] {
  if (locale === "en") {
    return [
      { img: digitalSoftware, tag: "SaaS", title: "Centralized business platform", location: "Moroccan SMEs · 2025" },
      { img: digitalCloud, tag: "Cloud", title: "Hosting & digital transformation", location: "Agadir · Morocco · 2025" },
      { img: digitalMarketing, tag: "Digital marketing", title: "SEO & acquisition strategy", location: "Morocco · 2025" },
      { img: sectorMining, tag: "Mining", title: "Wear parts supply", location: "Khouribga · Morocco · 2024" },
      { img: sectorInfrastructure, tag: "Infrastructure", title: "Support for major structures", location: "Motorway corridor · Morocco · 2024" },
      { img: sectorConstruction, tag: "Industrial construction", title: "Complex industrial site supply", location: "Agadir · Morocco · 2025" },
    ];
  }
  if (locale === "es") {
    return [
      { img: digitalSoftware, tag: "SaaS", title: "Plataforma de gestion centralizada", location: "PYMES marroquies · 2025" },
      { img: digitalCloud, tag: "Cloud", title: "Alojamiento y transformacion digital", location: "Agadir · Marruecos · 2025" },
      { img: digitalMarketing, tag: "Marketing digital", title: "Estrategia SEO y adquisicion", location: "Marruecos · 2025" },
      { img: sectorMining, tag: "Mineria", title: "Suministro de piezas de desgaste", location: "Khouribga · Marruecos · 2024" },
      { img: sectorInfrastructure, tag: "Infraestructura", title: "Soporte para gran obra", location: "Corredor vial · Marruecos · 2024" },
      { img: sectorConstruction, tag: "Construccion", title: "Suministro obra industrial", location: "Agadir · Marruecos · 2025" },
    ];
  }
  return [
    { img: digitalSoftware, tag: "SaaS", title: "Plateforme métier centralisée", location: "PME marocaines · 2025" },
    { img: digitalCloud, tag: "Cloud", title: "Hébergement & transformation digitale", location: "Agadir · Maroc · 2025" },
    { img: digitalMarketing, tag: "Marketing digital", title: "Stratégie SEO & acquisition", location: "Maroc · 2025" },
    { img: sectorMining, tag: "Mines & carrières", title: "Approvisionnement pièces d'usure", location: "Khouribga · Maroc · 2024" },
    { img: sectorInfrastructure, tag: "Infrastructure", title: "Soutien matériel ouvrage d'art", location: "Axe autoroutier · Maroc · 2024" },
    { img: sectorConstruction, tag: "BTP industriel", title: "Fourniture chantier complexe", location: "Agadir · Maroc · 2025" },
  ];
}

function sectionTitle(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Projects & case studies",
      titleA: "Digital platforms and",
      titleB: "industrial delivery",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Proyectos y casos",
      titleA: "Plataformas digitales y",
      titleB: "entrega industrial",
    };
  }
  return {
    eyebrow: "Réalisations",
    titleA: "Plateformes digitales et",
    titleB: "livraisons industrielles",
  };
}

function ProjectsStack({ locale, projects }: { locale: Locale; projects: Project[] }) {
  const t = sectionTitle(locale);
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef, 3);
  const count = projects.length;

  return (
    <section id="projets" ref={sectionRef} className="relative bg-[var(--navy-deep)] text-[var(--ivory)]">
      <div className="px-6 lg:px-16 pt-32 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
          <h2 className="mt-6 display-xl text-5xl lg:text-7xl max-w-4xl">
            {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span>.
          </h2>
        </div>
      </div>

      <div className="relative" style={{ height: `${count * 80 + 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center justify-center px-6 lg:px-16">
          <div className="relative w-full max-w-[1200px] aspect-[4/3] lg:aspect-[16/10]">
            {projects.map((p, i) => {
              const segment = 1 / count;
              const start = i * segment;
              const end = (i + 1) * segment;
              const local = Math.max(0, Math.min(1, (progress - start) / segment));
              const isLast = i === count - 1;
              const scale = isLast && progress > end - segment * 0.3 ? 1 + (progress - (end - segment * 0.3)) * 0.08 : 0.92 + local * 0.06;
              const translateY = (1 - local) * 40 + (i - Math.min(count - 1, Math.floor(progress * count))) * 8;
              const opacity = progress >= start ? 1 : 0;
              const zIndex = i + 1;

              return (
                <article
                  key={p.title}
                  className="absolute inset-0 overflow-hidden border border-[var(--gold)]/20 will-change-transform"
                  style={{
                    opacity,
                    zIndex,
                    transform: `translateY(${translateY}px) scale(${Math.min(scale, 1.06)})`,
                  }}
                >
                  <Image src={p.img} alt={p.title} fill sizes="100vw" className="object-cover" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 30%, oklch(0.165 0.045 263 / 0.9) 100%)",
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 z-10">
                    <span className="eyebrow text-[var(--gold)]">{p.tag}</span>
                    <h3 className="mt-3 font-display text-3xl lg:text-5xl">{p.title}</h3>
                    <p className="mt-2 eyebrow text-[var(--ivory)]/60">{p.location}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectsGrid({ locale, projects }: { locale: Locale; projects: Project[] }) {
  const t = sectionTitle(locale);
  return (
    <section id="projets" className="py-32 lg:py-40 bg-[var(--ivory)]">
      <div className="px-6 lg:px-16 max-w-[1400px] mx-auto">
        <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
        <h2 className="mt-6 display-xl text-5xl lg:text-7xl text-[var(--navy)] max-w-4xl">
          {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span>.
        </h2>
        <div className="mt-16 grid sm:grid-cols-2 gap-px bg-[var(--navy)]/15">
          {projects.map((p) => (
            <article key={p.title} className="bg-[var(--ivory)]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={p.img} alt={p.title} fill sizes="50vw" className="object-cover" />
                <div className="absolute top-4 left-4 px-3 py-1 bg-[var(--gold)] text-[var(--navy-deep)] eyebrow">{p.tag}</div>
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl text-[var(--navy)]">{p.title}</h3>
                <p className="mt-2 text-xs eyebrow text-[var(--navy)]/50">{p.location}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Projects({ locale = "fr" }: { locale?: Locale }) {
  const projects = projectsData(locale);
  const reduced = usePrefersReducedMotion();
  if (reduced) return <ProjectsGrid locale={locale} projects={projects} />;
  return <ProjectsStack locale={locale} projects={projects} />;
}
