"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import sectorMining from "@/assets/sector-mining.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import type { Locale } from "@/lib/i18n";
import { usePrefersReducedMotion } from "@/components/site/motion";

type SectorSlide = { img: StaticImageData; title: string; desc: string; bullets: string[] };

function sectorsData(locale: Locale): SectorSlide[] {
  if (locale === "en") {
    return [
      {
        img: sectorMining,
        title: "Mining & quarries",
        desc: "Wear parts, screening, heavy maintenance for extractive sites.",
        bullets: ["Crusher wear parts", "Conveyor systems", "On-site maintenance"],
      },
      {
        img: sectorConstruction,
        title: "Construction & industry",
        desc: "Materials and equipment for complex industrial worksites.",
        bullets: ["Civil works supply", "Site equipment", "Multi-brand sourcing"],
      },
      {
        img: sectorInfrastructure,
        title: "Infrastructure",
        desc: "Support for roads, structures and public projects.",
        bullets: ["Major structures", "Urban projects", "Export logistics"],
      },
    ];
  }
  if (locale === "es") {
    return [
      {
        img: sectorMining,
        title: "Mineria y canteras",
        desc: "Piezas de desgaste, cribado y mantenimiento pesado.",
        bullets: ["Desgaste de trituracion", "Transportadores", "Mantenimiento en sitio"],
      },
      {
        img: sectorConstruction,
        title: "Construccion e industria",
        desc: "Materiales y equipos para obras industriales complejas.",
        bullets: ["Suministro de obra", "Equipos de sitio", "Sourcing multimarca"],
      },
      {
        img: sectorInfrastructure,
        title: "Infraestructuras",
        desc: "Apoyo a carreteras, estructuras y proyectos publicos.",
        bullets: ["Grandes estructuras", "Proyectos urbanos", "Logistica export"],
      },
    ];
  }
  return [
    {
      img: sectorMining,
      title: "Mines & carrières",
      desc: "Pièces d'usure, criblage, maintenance lourde sur sites extractifs.",
      bullets: ["Pièces d'usure concassage", "Convoyeurs & bandes", "Maintenance terrain"],
    },
    {
      img: sectorConstruction,
      title: "BTP & industrie",
      desc: "Matériaux et équipements pour chantiers industriels complexes.",
      bullets: ["Fourniture génie civil", "Équipements chantier", "Sourcing multi-marques"],
    },
    {
      img: sectorInfrastructure,
      title: "Infrastructures",
      desc: "Soutien aux routes, ouvrages d'art et projets publics.",
      bullets: ["Ouvrages d'art", "Projets urbains", "Logistique export"],
    },
  ];
}

function sectionTitle(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Industrial sectors served",
      titleA: "Where",
      titleB: "industry",
      titleC: "moves forward, we supply & deliver.",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Sectores industriales",
      titleA: "Donde la",
      titleB: "industria",
      titleC: "avanza, suministramos y entregamos.",
    };
  }
  return {
    eyebrow: "Secteurs industriels",
    titleA: "Là où",
    titleB: "l'industrie",
    titleC: "avance, nous fournissons & livrons.",
  };
}

export function Sectors({ locale = "fr" }: { locale?: Locale }) {
  const slides = sectorsData(locale);
  const t = sectionTitle(locale);
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced || slides.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(id);
  }, [slides.length, reduced]);

  const current = slides[active]!;

  return (
    <section id="secteurs" className="py-32 lg:py-40 bg-[var(--navy-deep)] text-[var(--ivory)] relative overflow-hidden">
      <div className="absolute inset-0 bg-topo opacity-[0.05] mix-blend-screen" />
      <div className="relative px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-5">
            <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
            <h2 className="mt-6 display-xl text-5xl lg:text-6xl xl:text-7xl text-[var(--ivory)]">
              {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
            </h2>
            <div className="mt-10 space-y-4">
              {slides.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`block w-full text-left border-l-2 pl-4 py-2 transition-colors ${
                    i === active ? "border-[var(--gold)] text-[var(--gold)]" : "border-[var(--ivory)]/20 text-[var(--ivory)]/50 hover:text-[var(--ivory)]"
                  }`}
                >
                  <span className="font-display text-xl uppercase">{s.title}</span>
                </button>
              ))}
            </div>
            <ul className="mt-8 space-y-2">
              {current.bullets.map((b) => (
                <li key={b} className="text-sm text-[var(--ivory)]/70 flex items-center gap-3">
                  <span className="h-px w-6 bg-[var(--gold)]" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 relative aspect-[4/3] lg:aspect-[16/10] overflow-hidden">
            {slides.map((s, i) => (
              <Image
                key={s.title}
                src={s.img}
                alt={s.title}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-opacity duration-1000"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.165 0.045 263 / 0.85) 0%, oklch(0.165 0.045 263 / 0.2) 60%, transparent 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 p-8 lg:p-10">
              <h3 className="font-display text-3xl lg:text-4xl text-[var(--ivory)]">{current.title}</h3>
              <p className="mt-3 max-w-md text-[var(--ivory)]/75">{current.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
