"use client";

import { ArrowUpRight } from "lucide-react";
import type { StaticImageData } from "next/image";
import sectorMining from "@/assets/sector-mining.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import sectorLogistics from "@/assets/sector-logistics.jpg";
import sectorEquipment from "@/assets/sector-equipment.jpg";
import catMotors from "@/assets/cat-motors.jpg";
import catHydraulic from "@/assets/cat-hydraulic.jpg";
import type { Locale } from "@/lib/i18n";
import { FadeImage } from "@/components/site/motion";

type Activity = { title: string; desc: string; img: StaticImageData; span: string };

function activitiesData(locale: Locale): Activity[] {
  if (locale === "en") {
    return [
      { title: "Construction & materials", desc: "Supply and support for civil and building projects.", img: sectorConstruction, span: "md:col-span-2 md:row-span-2" },
      { title: "Infrastructure works", desc: "Road, urban and industrial infrastructure projects.", img: sectorInfrastructure, span: "md:col-span-2" },
      { title: "Logistics & transport", desc: "Secured delivery to remote sites.", img: sectorLogistics, span: "md:col-span-1" },
      { title: "Trade & distribution", desc: "Multi-brand industrial products.", img: sectorEquipment, span: "md:col-span-1" },
      { title: "Import-export", desc: "International sourcing across Africa.", img: catHydraulic, span: "md:col-span-1" },
      { title: "Public works", desc: "Support for TP contractors.", img: sectorConstruction, span: "md:col-span-1" },
      { title: "Industrial equipment", desc: "Motors, conveyors, critical parts.", img: catMotors, span: "md:col-span-2" },
      { title: "Mining support", desc: "Wear parts, screening, maintenance.", img: sectorMining, span: "md:col-span-2 md:row-span-1" },
    ];
  }
  if (locale === "es") {
    return [
      { title: "Construccion y materiales", desc: "Suministro para obras civiles y edificacion.", img: sectorConstruction, span: "md:col-span-2 md:row-span-2" },
      { title: "Infraestructura", desc: "Proyectos viales, urbanos e industriales.", img: sectorInfrastructure, span: "md:col-span-2" },
      { title: "Logistica", desc: "Entregas seguras en sitios remotos.", img: sectorLogistics, span: "md:col-span-1" },
      { title: "Comercio y distribucion", desc: "Productos industriales multimarca.", img: sectorEquipment, span: "md:col-span-1" },
      { title: "Import-export", desc: "Sourcing internacional en Africa.", img: catHydraulic, span: "md:col-span-1" },
      { title: "Obras publicas", desc: "Soporte para empresas de TP.", img: sectorConstruction, span: "md:col-span-1" },
      { title: "Equipamiento industrial", desc: "Motores, transportadores, piezas criticas.", img: catMotors, span: "md:col-span-2" },
      { title: "Soporte minero", desc: "Desgaste, cribado, mantenimiento.", img: sectorMining, span: "md:col-span-2" },
    ];
  }
  return [
    { title: "Construction & matériaux", desc: "Fourniture pour chantiers BTP et génie civil.", img: sectorConstruction, span: "md:col-span-2 md:row-span-2" },
    { title: "Infrastructures", desc: "Projets routiers, urbains et industriels.", img: sectorInfrastructure, span: "md:col-span-2" },
    { title: "Logistique & transport", desc: "Livraisons sécurisées sur sites distants.", img: sectorLogistics, span: "md:col-span-1" },
    { title: "Commerce & distribution", desc: "Produits industriels multi-marques.", img: sectorEquipment, span: "md:col-span-1" },
    { title: "Import-export", desc: "Sourcing international vers l'Afrique.", img: catHydraulic, span: "md:col-span-1" },
    { title: "Travaux publics", desc: "Appui aux entreprises de TP.", img: sectorConstruction, span: "md:col-span-1" },
    { title: "Équipement industriel", desc: "Moteurs, convoyeurs, pièces critiques.", img: catMotors, span: "md:col-span-2" },
    { title: "Mines & carrières", desc: "Usure, criblage, maintenance lourde.", img: sectorMining, span: "md:col-span-2" },
  ];
}

function sectionTitle(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Industrial division",
      titleA: "A",
      titleB: "multi-sector",
      titleC: "B2B offer for construction, mining & infrastructure.",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Division industrial",
      titleA: "Una oferta",
      titleB: "multisectorial",
      titleC: "B2B para construccion, mineria e infraestructura.",
    };
  }
  return {
    eyebrow: "Pôle industriel",
    titleA: "Une offre",
    titleB: "multi-sectorielle",
    titleC: "B2B pour le BTP, les mines & l'infrastructure.",
  };
}

export function Activities({ locale = "fr" }: { locale?: Locale }) {
  const activities = activitiesData(locale);
  const t = sectionTitle(locale);

  return (
    <section id="activites" className="relative py-32 lg:py-40 bg-[var(--navy-deep)] text-[var(--ivory)] overflow-hidden">
      <div className="absolute inset-0 bg-topo opacity-[0.06] mix-blend-screen" />
      <div className="relative px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16">
            <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
            <h2 className="mt-6 display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--ivory)] max-w-4xl">
              {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 auto-rows-[minmax(180px,1fr)] md:auto-rows-[200px]">
            {activities.map((item, i) => (
              <article
                key={item.title}
                className={`group relative overflow-hidden border border-[var(--gold)]/15 ${item.span} min-h-[200px]`}
              >
                <FadeImage
                  src={item.img}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  fadeDelay={i * 80}
                />
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.1) 0%, oklch(0.165 0.045 263 / 0.92) 100%)",
                  }}
                />
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between">
                  <ArrowUpRight className="h-5 w-5 text-[var(--ivory)]/40 group-hover:text-[var(--gold)] transition-colors self-end" />
                  <div>
                    <h3 className="font-display text-xl lg:text-2xl text-[var(--ivory)] group-hover:text-[var(--gold)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--ivory)]/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
