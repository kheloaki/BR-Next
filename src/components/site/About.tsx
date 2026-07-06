"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import digitalSoftware from "@/assets/digital-software.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import type { Locale } from "@/lib/i18n";
import { ScrollRevealWords, usePrefersReducedMotion } from "@/components/site/motion";

function aboutCopy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "About",
      values: ["Digital platforms", "Cloud & SaaS", "Industrial B2B"],
      titleA: "A digital startup in Agadir,",
      titleB: "with an industrial",
      titleC: "division built for the field.",
      tag: "Agadir · Morocco",
      p1:
        "BARANE INVEST develops business software, SaaS platforms, web & mobile apps, cloud hosting, AI automation and e-commerce — from strategy to delivery and maintenance.",
      p2:
        "In parallel, we supply construction, infrastructure, logistics and industrial equipment to contractors, mines and large-scale projects across Morocco and Africa.",
      bullets: [
        "Digital: SaaS, web/mobile, cloud, AI & e-commerce",
        "Industry: multi-brand sourcing & nationwide logistics",
        "Moroccan company — professional governance",
        "One structure: consulting, dev, hosting & maintenance",
        "Agadir HQ — national & international reach",
      ],
      ctaDigital: "Digital services",
      ctaIndustrial: "Industrial activities",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Nosotros",
      values: ["Plataformas digitales", "Cloud y SaaS", "Industria B2B"],
      titleA: "Una startup digital en Agadir,",
      titleB: "con un pilar",
      titleC: "industrial orientado al terreno.",
      tag: "Agadir · Marruecos",
      p1:
        "BARANE INVEST desarrolla software de gestion, plataformas SaaS, apps web y moviles, cloud, automatizacion con IA y e-commerce — de la estrategia a la entrega y el mantenimiento.",
      p2:
        "En paralelo, suministramos construccion, infraestructura, logistica y equipamiento industrial a contratistas, minas y grandes obras en Marruecos y Africa.",
      bullets: [
        "Digital: SaaS, web/movil, cloud, IA y e-commerce",
        "Industria: sourcing multimarca y logistica nacional",
        "Empresa marroqui — gobernanza profesional",
        "Una estructura: consultoria, dev, hosting y mantenimiento",
        "Sede en Agadir — alcance nacional e internacional",
      ],
      ctaDigital: "Servicios digitales",
      ctaIndustrial: "Actividades industriales",
    };
  }
  return {
    eyebrow: "À propos",
    values: ["Plateformes digitales", "Cloud & SaaS", "Industrie B2B"],
    titleA: "Une startup digitale à Agadir,",
    titleB: "avec un pôle",
    titleC: "industriel opérationnel.",
    tag: "Agadir · Maroc",
    p1:
      "BARANE INVEST développe logiciels métiers, plateformes SaaS, applications web & mobiles, cloud, automatisation IA et e-commerce — de la stratégie à la livraison et la maintenance.",
    p2:
      "En parallèle, nous fournissons construction, infrastructure, logistique et équipement industriel aux contractants, mines et grands chantiers au Maroc et en Afrique.",
    bullets: [
      "Digital : SaaS, web/mobile, cloud, IA & e-commerce",
      "Industrie : sourcing multi-marques & logistique nationale",
      "Société marocaine — gouvernance professionnelle",
      "Une structure : conseil, dev, hébergement & maintenance",
      "Siège à Agadir — rayonnement national & international",
    ],
    ctaDigital: "Services digitaux",
    ctaIndustrial: "Activités industrielles",
  };
}

function RotatingValues({ values }: { values: string[] }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || values.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % values.length), 3200);
    return () => clearInterval(id);
  }, [values.length, reduced]);

  const active = reduced ? 0 : index;

  return (
    <div className="relative h-24 lg:h-32 mb-12 overflow-hidden">
      {values.map((line, i) => (
        <p
          key={line}
          className="absolute inset-0 flex items-center display-xl text-3xl lg:text-5xl text-[var(--navy)] transition-all duration-700"
          style={{
            opacity: i === active ? 1 : 0,
            transform: i === active ? "translateY(0)" : "translateY(1rem)",
          }}
        >
          <span className="text-[var(--gold)]">{line}</span>
        </p>
      ))}
    </div>
  );
}

export function About({ locale = "fr" }: { locale?: Locale }) {
  const t = aboutCopy(locale);
  const prefix = locale === "en" ? "/en" : locale === "es" ? "/es" : "";

  return (
    <section id="about" className="relative py-32 lg:py-40 bg-[var(--ivory)] overflow-hidden">
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
          <RotatingValues values={t.values} />
          <h2 className="display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--navy)] max-w-5xl">
            {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
          </h2>
          <div className="mt-16 grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={digitalSoftware}
                  alt="BARANE INVEST — services digitaux"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-[var(--gold)] text-[var(--navy-deep)] text-[10px] tracking-[0.3em] font-bold uppercase">
                  {t.tag}
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 flex flex-col justify-between">
              <ScrollRevealWords
                text={`${t.p1} ${t.p2}`}
                className="text-lg lg:text-xl text-[var(--graphite)] leading-relaxed"
              />
              <ul className="mt-12 divide-y divide-[var(--navy)]/10 border-t border-b border-[var(--navy)]/10">
                {t.bullets.map((p) => (
                  <li key={p} className="py-4 text-[var(--navy)] font-medium">
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button variant="navy" size="lg" asChild>
                  <Link href={`${prefix}/services`}>
                    {t.ctaDigital} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outlineNavy" size="lg" asChild>
                  <Link href={`${prefix}/activites`}>
                    {t.ctaIndustrial} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
