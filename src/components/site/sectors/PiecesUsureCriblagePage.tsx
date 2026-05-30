"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Grid3x3,
  Layers,
  MessageCircle,
  RotateCcw,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import sectorMining from "@/assets/sector-mining.jpg";
import type { Locale } from "@/lib/i18n";

type ProductFamily = {
  icon: typeof Layers;
  title: string;
  text: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Technical guide · Mining & quarries",
      backLink: "Back to mining and quarries",
      h1: "Wear parts and screening in mining: practical guide",
      heroLead:
        "What buyers need to know before ordering crusher liners, screen grids or conveyor wear — and how to secure the right reference from Agadir.",
      s1Title: "What is a wear part in a mining context?",
      s1P1:
        "A wear part is any component that absorbs abrasion, impact or fatigue in crushing, screening or conveying lines. Unlike standard spare parts, its lifetime is measured in tonnes processed or operating hours — not calendar time.",
      s1P2:
        "Typical examples on Moroccan and West African sites: crusher liners and blow bars, impact plates, vibrating screen decks (polyurethane or steel), conveyor belts and cleaners, bucket elevator bottoms and rubber linings on transfer points.",
      s1ListLabel: "Common families on site:",
      s1Items: [
        "Crusher liners and manganese/chromium wear parts",
        "Impact plates and hammers",
        "Screening grids and modular panels",
        "Conveyor belts and transfer-point rubber",
        "Bucket elevator and chute linings",
      ],
      s2Title: "How to choose the right wear part?",
      s2P1:
        "The wrong reference costs more in downtime than in purchase price. Before ordering, map four factors: ore abrasiveness (silica, clay, hardness), hourly tonnage, equipment type (cone, impact, jaw, vibrating screen) and target replacement cycle.",
      s2P2:
        "Barane Invest acts as a technical advisor — not just a catalogue. We cross-check your specs with available manganese grades, grid openings, belt compounds and lead times, then propose alternatives if a single brand is out of stock.",
      s2Factors: [
        { label: "Abrasiveness", desc: "Fine phosphate vs. hard aggregate changes liner grade and grid life." },
        { label: "Throughput", desc: "High tonnage requires heavier sections and reinforced fixing systems." },
        { label: "Crusher type", desc: "Impact, cone and jaw each have different wear patterns and geometries." },
        { label: "Target cycle", desc: "Planned shutdown vs. emergency replacement drives stock and sourcing strategy." },
      ],
      s3Title: "Product families available at Barane Invest",
      s3Intro:
        "From Agadir we source and deliver the references most requested on mining and quarry sites in Morocco and Africa.",
      families: [
        {
          icon: Shield,
          title: "Manganese and chromium linings",
          text: "Liners, jaws, cones and wear plates sized to your crusher model and processed material.",
        },
        {
          icon: Grid3x3,
          title: "Polyurethane and steel screen media",
          text: "Panels and grids for vibrating screens — opening, thickness and fixing adapted to your screener.",
        },
        {
          icon: Layers,
          title: "Fenner and ContiTech belts",
          text: "Conveyor belts, cleaners and splice materials for long conveying lines on extractive sites.",
        },
        {
          icon: RotateCcw,
          title: "Rollers and conveyor drums",
          text: "Carrying and return rollers, drive drums and lagging for maintenance and upgrade projects.",
        },
      ] as ProductFamily[],
      s4Title: "Why standardise your critical references?",
      s4P1:
        "Sites that document critical wear references — with photos, dimensions and OEM codes — cut emergency lead times and avoid improvised purchases at premium prices.",
      s4P2:
        "Standardisation also allows planned maintenance stops: critical grids and liners in stock, replacement cycles aligned with production, and fewer multi-day shutdowns due to missing references.",
      s4Bullets: [
        "Fewer unplanned production stops",
        "Shorter order lead times on repeat references",
        "Better total cost of ownership vs. spot buying",
        "Technical traceability for audits and tenders",
      ],
      relatedTitle: "See also",
      linkMines: "Mining and quarries — our full offer",
      linkCatalogue: "Industrial product catalogue",
      linkContact: "Contact and quote request",
      ctaTitle: "Request a quote for your wear parts",
      ctaBody:
        "Send references, photos or OEM codes — we reply within 24 business hours.",
      ctaButton: "Wear parts quote",
      ctaWhatsapp: "WhatsApp",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Guia tecnica · Mineria y canteras",
      backLink: "Volver a mineria y canteras",
      h1: "Piezas de desgaste y cribado en entorno minero: guia practica",
      heroLead:
        "Lo que debe saber un comprador antes de pedir revestimientos, mallas o desgaste de bandas — y como asegurar la referencia desde Agadir.",
      s1Title: "Que es una pieza de desgaste en mineria?",
      s1P1:
        "Es todo componente que absorbe abrasion, impacto o fatiga en trituracion, cribado o transporte. Su vida util se mide en toneladas o horas de operacion.",
      s1P2:
        "Ejemplos habituales: revestimientos de trituradoras, placas de impacto, mallas de cribas vibrantes, bandas transportadoras y fondos de elevadores.",
      s1ListLabel: "Familias frecuentes:",
      s1Items: [
        "Revestimientos manganeso y cromo",
        "Placas y martillos",
        "Mallas de cribado",
        "Bandas y gomas de transferencia",
        "Revestimientos de cangilones",
      ],
      s2Title: "Como elegir la pieza adecuada?",
      s2P1:
        "Cuatro factores: abrasividad del mineral, tonelaje horario, tipo de trituradora y ciclo de reemplazo objetivo.",
      s2P2:
        "Barane Invest actua como asesor tecnico: cruzamos especificaciones con grados disponibles, aperturas de malla y plazos de entrega.",
      s2Factors: [
        { label: "Abrasividad", desc: "Fosfato fino vs. arido duro cambia el grado de revestimiento." },
        { label: "Tonelaje", desc: "Alto caudal exige secciones mas robustas." },
        { label: "Tipo trituradora", desc: "Impacto, cono y mandibula tienen patrones distintos." },
        { label: "Ciclo objetivo", desc: "Parada planificada vs. urgencia define el stock." },
      ],
      s3Title: "Familias de productos en Barane Invest",
      s3Intro: "Desde Agadir, referencias para minas y canteras en Marruecos y Africa.",
      families: [
        { icon: Shield, title: "Revestimientos manganeso y cromo", text: "Para modelos de trituradora y material tratado." },
        { icon: Grid3x3, title: "Mallas poliuretano y metal", text: "Paneles para cribas vibrantes." },
        { icon: Layers, title: "Bandas Fenner y ContiTech", text: "Bandas, limpiadores y empalmes." },
        { icon: RotateCcw, title: "Rodillos y tambores", text: "Rodillos, tambores motrices y recubrimientos." },
      ] as ProductFamily[],
      s4Title: "Por que estandarizar referencias criticas?",
      s4P1: "Documentar referencias reduce plazos de urgencia y compras improvisadas.",
      s4P2: "Permite paradas planificadas con stock critico y mejor costo total.",
      s4Bullets: [
        "Menos paradas no planificadas",
        "Plazos mas cortos en repetición",
        "Mejor costo total de explotacion",
        "Trazabilidad para licitaciones",
      ],
      relatedTitle: "Ver tambien",
      linkMines: "Mineria y canteras — nuestra oferta",
      linkCatalogue: "Catalogo industrial",
      linkContact: "Contacto y cotizacion",
      ctaTitle: "Solicite cotizacion para piezas de desgaste",
      ctaBody: "Envie referencias, fotos o codigos OEM — respondemos en 24h laborables.",
      ctaButton: "Cotizacion piezas de desgaste",
      ctaWhatsapp: "WhatsApp",
    };
  }
  return {
    eyebrow: "Guide technique · Mines & carrières",
    backLink: "Retour aux mines et carrières",
    h1: "Pièces d'usure et criblage en environnement minier : guide pratique",
    heroLead:
      "Ce que les acheteurs miniers doivent savoir avant de commander revêtements de concasseurs, grilles de criblage ou pièces d'usure de convoyeur — et comment sécuriser la bonne référence depuis Agadir.",
    s1Title: "Qu'est-ce qu'une pièce d'usure en contexte minier ?",
    s1P1:
      "Une pièce d'usure est tout composant qui absorbe l'abrasion, l'impact ou la fatigue dans les lignes de concassage, criblage ou convoyage. Contrairement à une pièce de rechange standard, sa durée de vie se mesure en tonnes traitées ou en heures de marche — pas en mois calendaires.",
    s1P2:
      "Exemples concrets sur les sites marocains et ouest-africains : revêtements de concasseurs et marteaux, plaques de frappe, modules de cribles vibrants (polyuréthane ou acier), bandes transporteuses et racleurs, fonds de godets d'élévateurs et revêtements caoutchouc aux points de transfert.",
    s1ListLabel: "Familles les plus demandées sur site :",
    s1Items: [
      "Revêtements concasseurs (manganèse, chrome)",
      "Plaques de frappe et marteaux",
      "Grilles et modules de criblage",
      "Bandes transporteuses et caoutchouc de transfert",
      "Revêtements godets et goulottes",
    ],
    s2Title: "Comment choisir la bonne pièce d'usure ?",
    s2P1:
      "Une mauvaise référence coûte plus cher en arrêt de production qu'en prix d'achat. Avant de commander, croisez quatre facteurs : abrasivité du minerai (silice, argile, dureté), tonnage horaire, type d'équipement (concasseur à cône, à impact, à mâchoires, crible vibrant) et fréquence de remplacement cible.",
    s2P2:
      "Barane Invest intervient comme conseiller technique — pas seulement comme vendeur. Nous recoupons votre besoin aux grades de manganèse disponibles, aux ouvertures de grille, aux composés de bande et aux délais réels, puis proposons des alternatives si une marque unique est en rupture.",
    s2Factors: [
      {
        label: "Abrasivité",
        desc: "Phosphate fin vs granulats durs impose un grade de revêtement et une durée de grille différents.",
      },
      {
        label: "Tonnage horaire",
        desc: "Les débits élevés exigent des épaisseurs et systèmes de fixation renforcés.",
      },
      {
        label: "Type de concasseur",
        desc: "Impact, cône et mâchoires ont des géométries et modes d'usure distincts.",
      },
      {
        label: "Cycle cible",
        desc: "Arrêt planifié ou urgence terrain orientent stock et stratégie d'approvisionnement.",
      },
    ],
    s3Title: "Les familles de produits disponibles chez Barane Invest",
    s3Intro:
      "Depuis Agadir, nous sourçons et livrons les références les plus demandées sur sites miniers et carrières au Maroc et en Afrique — pièces d'usure mines criblage Maroc, revêtements concasseurs et grilles pour carrières.",
    families: [
      {
        icon: Shield,
        title: "Revêtements en manganèse et chrome",
        text: "Doublures, mâchoires, cônes et plaques d'usure dimensionnés selon votre modèle de concasseur et le matériau traité.",
      },
      {
        icon: Grid3x3,
        title: "Grilles polyuréthane et métal",
        text: "Panneaux et grilles pour cribles vibrants — ouverture, épaisseur et fixation adaptées à votre équipement.",
      },
      {
        icon: Layers,
        title: "Bandes transporteuses Fenner et ContiTech",
        text: "Bandes, racleurs et matériels d'emploi pour longues lignes de convoyage sur sites extractifs.",
      },
      {
        icon: RotateCcw,
        title: "Rouleaux et tambours de convoyeurs",
        text: "Rouleaux porteurs et de retour, tambours motrices et lagging pour maintenance et projets de mise à niveau.",
      },
    ] as ProductFamily[],
    s4Title: "Pourquoi standardiser ses références critiques ?",
    s4P1:
      "Les sites qui documentent leurs références critiques d'usure — avec photos, cotes et codes constructeur — réduisent les délais d'urgence et évitent les achats improvisés à prix majorés.",
    s4P2:
      "La standardisation permet aussi des arrêts de maintenance planifiés : grilles et revêtements critiques en stock, cycles de remplacement alignés sur la production, et moins d'arrêts multi-jours faute de référence disponible.",
    s4Bullets: [
      "Moins d'arrêts de production non planifiés",
      "Délais de commande raccourcis sur références récurrentes",
      "Meilleur coût global d'exploitation qu'achat ponctuel",
      "Traçabilité technique pour audits et appels d'offres",
    ],
    relatedTitle: "À voir aussi",
    linkMines: "Mines et carrières — notre offre complète",
    linkCatalogue: "Catalogue produits industriels",
    linkContact: "Contact et demande de devis",
    ctaTitle: "Demandez un devis pour vos pièces d'usure",
    ctaBody:
      "Envoyez références, photos ou codes OEM — nous répondons sous 24 h ouvrées.",
    ctaButton: "Devis pièces d'usure",
    ctaWhatsapp: "WhatsApp",
  };
}

export function PiecesUsureCriblagePageContent({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t = copy(locale);
  const href = (path: string) => `${pathPrefix}${path}`;

  return (
    <>
      <section className="relative min-h-[58vh] overflow-hidden bg-[var(--navy-deep)]">
        <div className="absolute inset-0">
          <Image
            src={sectorMining}
            alt="Pièces d'usure mines criblage Maroc — guide technique"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.75) 0%, oklch(0.165 0.045 263 / 0.92) 70%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-14 pt-28 lg:px-16 lg:pb-16">
          <Link
            href={href("/secteurs/mines-carrieres")}
            className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-[var(--gold)] hover:text-[var(--gold-soft)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.backLink}
          </Link>
          <p className="mt-8 eyebrow text-[var(--gold)]">{t.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-display text-3xl uppercase leading-[0.95] tracking-tight text-[var(--ivory)] sm:text-4xl lg:text-[2.75rem]">
            {t.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--ivory)]/80">{t.heroLead}</p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <span className="eyebrow text-[var(--gold)]">01</span>
              <h2 className="mt-4 display-xl text-2xl lg:text-3xl text-[var(--navy)]">{t.s1Title}</h2>
            </div>
            <div className="space-y-5 text-[var(--graphite)] leading-relaxed">
              <p>{t.s1P1}</p>
              <p>{t.s1P2}</p>
              <div className="border-l-2 border-[var(--gold)] pl-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">
                  {t.s1ListLabel}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {t.s1Items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-[var(--gold)]" aria-hidden>
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-[var(--ivory)] border-y border-[var(--navy)]/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <span className="eyebrow text-[var(--gold)]">02</span>
          <h2 className="mt-4 display-xl text-2xl lg:text-3xl text-[var(--navy)]">{t.s2Title}</h2>
          <p className="mt-5 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s2P1}</p>
          <p className="mt-4 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s2P2}</p>
          <div className="mt-10 grid gap-px border border-[var(--navy)]/15 bg-[var(--navy)]/15 sm:grid-cols-2">
            {t.s2Factors.map((f) => (
              <div key={f.label} className="bg-white p-6 lg:p-8">
                <ClipboardList className="h-6 w-6 text-[var(--gold)]" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-3 font-semibold text-[var(--navy)]">{f.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--graphite)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <span className="eyebrow text-[var(--gold)]">03</span>
          <h2 className="mt-4 display-xl text-2xl lg:text-3xl text-[var(--navy)]">{t.s3Title}</h2>
          <p className="mt-4 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s3Intro}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {t.families.map((fam) => {
              const Icon = fam.icon;
              return (
                <div
                  key={fam.title}
                  className="border border-[var(--navy)]/15 p-8 transition-colors hover:border-[var(--gold)]/50"
                >
                  <Icon className="h-7 w-7 text-[var(--gold)]" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">{fam.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--graphite)]">{fam.text}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-[var(--graphite)]">
            <Link href={href("/catalogue")} className="font-medium text-[var(--navy)] underline underline-offset-4">
              {t.linkCatalogue}
            </Link>
            {" · "}
            <Link
              href={href("/secteurs/mines-carrieres")}
              className="font-medium text-[var(--navy)] underline underline-offset-4"
            >
              {t.linkMines}
            </Link>
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-[var(--navy-deep)]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <span className="eyebrow text-[var(--gold)]">04</span>
              <h2 className="mt-4 display-xl text-2xl lg:text-3xl text-[var(--ivory)]">{t.s4Title}</h2>
              <p className="mt-5 text-[var(--ivory)]/80 leading-relaxed">{t.s4P1}</p>
              <p className="mt-4 text-[var(--ivory)]/80 leading-relaxed">{t.s4P2}</p>
            </div>
            <ul className="space-y-4 border border-[var(--ivory)]/15 p-8 lg:p-10">
              {t.s4Bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-[var(--ivory)]/90 text-sm leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[var(--gold)]" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--navy)]/10 bg-[var(--ivory)] py-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-6 px-6 text-sm lg:px-16">
          <span className="eyebrow text-[var(--graphite)]/60 w-full">{t.relatedTitle}</span>
          <Link href={href("/secteurs/mines-carrieres")} className="font-medium text-[var(--navy)] underline underline-offset-4">
            {t.linkMines}
          </Link>
          <Link href={href("/catalogue")} className="font-medium text-[var(--navy)] underline underline-offset-4">
            {t.linkCatalogue}
          </Link>
          <Link href={href("/contact")} className="font-medium text-[var(--navy)] underline underline-offset-4">
            {t.linkContact}
          </Link>
        </div>
      </section>

      <section className="bg-[var(--gold)] py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-6 text-center lg:px-16">
          <h2 className="display-xl text-2xl lg:text-3xl text-[var(--navy-deep)]">{t.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[var(--navy-deep)]/85">{t.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-none bg-[var(--navy-deep)] px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--navy)]"
            >
              <Link href={href("/contact")}>
                {t.ctaButton}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-[var(--navy-deep)] bg-transparent px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--navy-deep)] hover:bg-[var(--navy-deep)]/10"
            >
              <a href="https://wa.me/212661656042" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 inline h-4 w-4" />
                {t.ctaWhatsapp}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
