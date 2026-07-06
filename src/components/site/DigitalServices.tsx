"use client";

import { ArrowRight, ArrowUpRight, Cloud, Code2, ShoppingBag, Sparkles } from "lucide-react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import digitalSoftware from "@/assets/digital-software.jpg";
import digitalCloud from "@/assets/digital-cloud.jpg";
import digitalMarketing from "@/assets/digital-marketing.jpg";
import type { Locale } from "@/lib/i18n";

type Pillar = {
  icon: typeof Code2;
  title: string;
  desc: string;
  img: StaticImageData;
  span: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Digital division",
      titleA: "Software, cloud and growth —",
      titleB: "one digital partner",
      titleC: "for Moroccan businesses.",
      intro:
        "BARANE INVEST designs, publishes and operates business software, web and mobile apps, SaaS platforms, marketplaces and e-commerce solutions — with cloud, automation, AI and data at the core.",
      innovationTitle: "What makes it different",
      innovation: [
        "Scalable SaaS solutions tailored to Moroccan SMEs",
        "Automation, artificial intelligence and cloud tools built in",
        "One structure: consulting, development, hosting, maintenance and client acquisition",
        "Centralized platforms to manage sales, clients, documents and data",
        "Custom solutions built locally, then replicated nationally and internationally",
      ],
      pillars: [
        {
          icon: Code2,
          title: "Software, web & mobile",
          desc: "Business software, web & mobile apps, SaaS platforms and marketplaces.",
          img: digitalSoftware,
          span: "md:col-span-2 md:row-span-2",
        },
        {
          icon: Cloud,
          title: "Cloud & transformation",
          desc: "IT consulting, integration, cloud, automation, data and hosting.",
          img: digitalCloud,
          span: "md:col-span-2",
        },
        {
          icon: ShoppingBag,
          title: "Marketing & e-commerce",
          desc: "E-commerce, SEO, digital communication and content creation.",
          img: digitalMarketing,
          span: "md:col-span-2",
        },
      ] as Pillar[],
      ctaServices: "Explore digital services",
      ctaSolutions: "View solutions & products",
      badge: "SaaS · Web · Mobile · Cloud · AI",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Division digital",
      titleA: "Software, cloud y crecimiento —",
      titleB: "un socio digital",
      titleC: "para las empresas marroquies.",
      intro:
        "BARANE INVEST disena, edita y opera software de gestion, aplicaciones web y moviles, plataformas SaaS, marketplaces y soluciones e-commerce, con cloud, automatizacion, IA y datos en el centro.",
      innovationTitle: "Que lo hace diferente",
      innovation: [
        "Soluciones SaaS escalables adaptadas a las PYMES marroquies",
        "Automatizacion, inteligencia artificial y herramientas cloud integradas",
        "Una sola estructura: consultoria, desarrollo, hosting, mantenimiento y adquisicion de clientes",
        "Plataformas centralizadas para gestionar ventas, clientes, documentos y datos",
        "Soluciones a medida creadas localmente y luego replicadas a nivel nacional e internacional",
      ],
      pillars: [
        {
          icon: Code2,
          title: "Software, web y movil",
          desc: "Software de gestion, apps web y moviles, plataformas SaaS y marketplaces.",
          img: digitalSoftware,
          span: "md:col-span-2 md:row-span-2",
        },
        {
          icon: Cloud,
          title: "Cloud y transformacion",
          desc: "Consultoria IT, integracion, cloud, automatizacion, datos y hosting.",
          img: digitalCloud,
          span: "md:col-span-2",
        },
        {
          icon: ShoppingBag,
          title: "Marketing y e-commerce",
          desc: "E-commerce, SEO, comunicacion digital y creacion de contenidos.",
          img: digitalMarketing,
          span: "md:col-span-2",
        },
      ] as Pillar[],
      ctaServices: "Ver servicios digitales",
      ctaSolutions: "Ver soluciones y productos",
      badge: "SaaS · Web · Movil · Cloud · IA",
    };
  }
  return {
    eyebrow: "Pole digital",
    titleA: "Logiciels, cloud et croissance —",
    titleB: "un partenaire digital",
    titleC: "pour les entreprises marocaines.",
    intro:
      "BARANE INVEST développe, édite et exploite des logiciels métiers, applications web et mobiles, plateformes SaaS, marketplaces et solutions e-commerce — avec le cloud, l'automatisation, l'IA et la data au cœur.",
    innovationTitle: "Notre dimension innovante",
    innovation: [
      "Solutions SaaS évolutives adaptées aux PME marocaines",
      "Automatisation, intelligence artificielle et outils cloud intégrés",
      "Une seule structure : conseil, développement, hébergement, maintenance et acquisition client",
      "Plateformes centralisées pour gérer ventes, clients, documents et données",
      "Solutions sur mesure commercialisées localement, puis répliquées au national et à l'international",
    ],
    pillars: [
      {
        icon: Code2,
        title: "Logiciels, web & mobile",
        desc: "Logiciels métiers, applications web & mobiles, plateformes SaaS et marketplaces.",
        img: digitalSoftware,
        span: "md:col-span-2 md:row-span-2",
      },
      {
        icon: Cloud,
        title: "Cloud & transformation",
        desc: "Conseil IT, intégration, cloud, automatisation, data et hébergement.",
        img: digitalCloud,
        span: "md:col-span-2",
      },
      {
        icon: ShoppingBag,
        title: "Marketing & e-commerce",
        desc: "E-commerce, référencement, communication digitale et création de contenus.",
        img: digitalMarketing,
        span: "md:col-span-2",
      },
    ] as Pillar[],
    ctaServices: "Découvrir les services digitaux",
    ctaSolutions: "Voir les solutions & produits",
    badge: "SaaS · Web · Mobile · Cloud · IA",
  };
}

export function DigitalServices({ locale = "fr" }: { locale?: Locale }) {
  const t = copy(locale);

  return (
    <section
      id="digital"
      className="relative overflow-hidden bg-[var(--navy-deep)] py-32 text-[var(--ivory)] lg:py-40"
    >
      <div className="absolute inset-0 bg-topo opacity-[0.06] mix-blend-screen" />
      <div
        className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)" }}
      />
      <div className="relative px-6 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-14 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="mb-6 flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
              </div>
              <h2 className="display-xl max-w-4xl text-5xl text-[var(--ivory)] lg:text-7xl xl:text-8xl">
                {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
              </h2>
              <p className="mt-8 max-w-2xl leading-relaxed text-[var(--ivory)]/75">{t.intro}</p>
              <span className="mt-6 inline-block eyebrow text-[var(--ivory)]/40">{t.badge}</span>
            </div>
            <div className="lg:col-span-4 lg:pt-4">
              <div className="border border-[var(--gold)]/25 bg-[var(--navy)]/40 p-6 lg:p-8">
                <span className="eyebrow text-[var(--gold)]">{t.innovationTitle}</span>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ivory)]/80">
                  {t.innovation.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div id="solutions" className="grid auto-rows-[minmax(200px,1fr)] grid-cols-1 gap-2 md:grid-cols-4 md:auto-rows-[220px] scroll-mt-28">
            {t.pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className={`group relative min-h-[220px] overflow-hidden border border-[var(--gold)]/15 ${p.span}`}
                >
                  <Image
                    src={p.img}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background:
                        "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.15) 0%, oklch(0.165 0.045 263 / 0.92) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 lg:p-8">
                    <div className="flex items-center justify-between">
                      <Icon className="h-6 w-6 text-[var(--gold)]" />
                      <ArrowUpRight className="h-5 w-5 text-[var(--ivory)]/40 transition-colors group-hover:text-[var(--gold)]" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-[var(--ivory)] transition-colors group-hover:text-[var(--gold)] lg:text-3xl">
                        {p.title}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--ivory)]/65">{p.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-0 sm:flex-row sm:items-center">
            <Button variant="gold" size="xl" asChild>
              <Link href="#digital">
                {t.ctaServices} <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outlineLight" size="xl" asChild>
              <Link href="#solutions">{t.ctaSolutions}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
