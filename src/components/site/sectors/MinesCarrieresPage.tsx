"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  MessageCircle,
  Package,
  Settings,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import sectorMining from "@/assets/sector-mining.jpg";
import type { Locale } from "@/lib/i18n";
import { FadeImage } from "@/components/site/motion";

const BRANDS = ["SKF", "FAG", "NSK", "Timken", "Fenner", "ContiTech", "Siemens", "ABB", "Parker"];

type DeliveryCategory = {
  icon: typeof Package;
  title: string;
  text: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Mining & quarries · Morocco & Africa",
      h1: "Mining and quarries: industrial supply and field support — Barane Invest",
      heroLead:
        "B2B supplier for wear parts, bearings and conveying systems on mining and quarry sites — structured quotes within 24 business hours.",
      ctaCatalogue: "View catalogue",
      ctaContact: "Request a quote",
      ctaWhatsapp: "WhatsApp",
      offerTitle: "Our offer for mining sites",
      offerP1:
        "Barane Invest supplies the critical parts that keep crushing, screening and conveying lines running on phosphate mines, aggregate quarries and extractive sites across Morocco and West Africa. We work from Agadir with direct access to SKF, FAG, Fenner and ContiTech references, plus electrical, hydraulic and maintenance ranges.",
      offerP2:
        "Whether you need an emergency replacement on a shutdown, a multi-reference tender or recurring supply for a remote site, our team structures sourcing, lead times and delivery to your production constraints — with technical alternatives when a single brand is unavailable.",
      deliverTitle: "What we deliver",
      deliverIntro:
        "Each category below is covered with multi-brand sourcing, traceable references and delivery to isolated sites.",
      categories: [
        {
          icon: Wrench,
          title: "Wear parts",
          text: "Liners, hammers, impact plates, crusher grids and rubber linings sized to your equipment and processed material.",
        },
        {
          icon: Settings,
          title: "Bearings & drives",
          text: "SKF, FAG, NSK and Timken — ball, roller, spherical and housed units for conveyors, screens and crushers.",
        },
        {
          icon: Truck,
          title: "Conveyors & belts",
          text: "Fenner and ContiTech belts, rollers, drums and structures — supply, replacement and upgrade scenarios.",
        },
        {
          icon: Package,
          title: "Handling equipment",
          text: "Lifting systems, hoists, chains and site handling accessories for maintenance and installation teams.",
        },
        {
          icon: Zap,
          title: "Maintenance & lubrication",
          text: "Greases, seals, filtration and consumables to extend component life and reduce unplanned stops.",
        },
      ] as DeliveryCategory[],
      zonesTitle: "Areas we serve",
      zonesIntro:
        "We prioritise Morocco and North/West Africa, with export capacity from Agadir to remote sites.",
      zonesMa:
        "Morocco — Khouribga, Benguerir, Jerada, Bou Craa and other phosphate, coal and aggregate basins.",
      zonesDz: "Algeria — Annaba, Tlemcen, Béchar and mining supply corridors.",
      zonesAf: "West Africa — Senegal, Guinea and regional partners for cross-border deliveries.",
      whyTitle: "Why choose Barane Invest for your mining sites",
      whyItems: [
        { label: "24h response", desc: "Structured quotes and WhatsApp follow-up for urgent field needs." },
        { label: "Multi-brand sourcing", desc: "Technical options by performance, budget and lead time — not a single catalogue." },
        { label: "Remote delivery", desc: "Logistics to isolated sites with import-export support when needed." },
        { label: "Field-oriented team", desc: "Specifications, volumes and shutdown windows integrated into every proposal." },
      ],
      relatedTitle: "See also",
      linkPieces: "Wear parts & screening — technical guide",
      linkCatalogue: "Industrial product catalogue",
      ctaTitle: "Need supply for a mining or quarry site?",
      ctaBody:
        "Share your references, volumes and deadline — we reply within 24 business hours.",
      ctaForm: "Quote request form",
      brandsLabel: "Brands available",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Mineria y canteras · Marruecos y Africa",
      h1: "Mineria y canteras: suministro industrial y soporte en terreno — Barane Invest",
      heroLead:
        "Proveedor B2B de piezas de desgaste, rodamientos y transportadores para minas y canteras — cotizacion estructurada en 24h laborables.",
      ctaCatalogue: "Ver catalogo",
      ctaContact: "Solicitar cotizacion",
      ctaWhatsapp: "WhatsApp",
      offerTitle: "Nuestra oferta para sitios mineros",
      offerP1:
        "Barane Invest suministra las piezas criticas que mantienen en marcha trituracion, cribado y transporte en minas de fosfatos, canteras de aridos y sitios extractivos en Marruecos y Africa occidental. Operamos desde Agadir con referencias SKF, FAG, Fenner y ContiTech, ademas de gamas electricas, hidraulicas y de mantenimiento.",
      offerP2:
        "Ya sea un reemplazo urgente en parada, una licitacion multireferencia o un suministro recurrente en sitio aislado, estructuramos sourcing, plazos y entrega segun sus restricciones de produccion.",
      deliverTitle: "Lo que entregamos",
      deliverIntro: "Cada categoria se cubre con sourcing multimarca y entrega a sitios remotos.",
      categories: [
        { icon: Wrench, title: "Piezas de desgaste", text: "Revestimientos, martillos, placas, mallas de cribado y gomas." },
        { icon: Settings, title: "Rodamientos", text: "SKF, FAG, NSK y Timken para transportadores, cribas y trituradoras." },
        { icon: Truck, title: "Bandas y transportadores", text: "Fenner y ContiTech — bandas, rodillos, tambores y estructuras." },
        { icon: Package, title: "Manipulacion", text: "Sistemas de elevacion, polipastos y cadenas para mantenimiento." },
        { icon: Zap, title: "Mantenimiento", text: "Grasas, juntas, filtracion y consumibles." },
      ] as DeliveryCategory[],
      zonesTitle: "Zonas de intervencion",
      zonesIntro: "Prioridad Marruecos y Africa del Norte/Oeste, con exportacion desde Agadir.",
      zonesMa: "Marruecos — Khouribga, Benguerir, Jerada, Bou Craa y cuencas mineras.",
      zonesDz: "Argelia — Annaba, Tlemcen, Bechar.",
      zonesAf: "Africa occidental — Senegal, Guinea y socios regionales.",
      whyTitle: "Por que Barane Invest para sus sitios mineros",
      whyItems: [
        { label: "Respuesta 24h", desc: "Cotizaciones y seguimiento WhatsApp para urgencias." },
        { label: "Multimarca", desc: "Opciones por rendimiento, presupuesto y plazo." },
        { label: "Entrega remota", desc: "Logistica a sitios aislados con apoyo import-export." },
        { label: "Equipo de terreno", desc: "Especificaciones y ventanas de parada integradas." },
      ],
      relatedTitle: "Ver tambien",
      linkPieces: "Piezas de desgaste y cribado — guia",
      linkCatalogue: "Catalogo industrial",
      ctaTitle: "Necesita suministro para mina o cantera?",
      ctaBody: "Comparta referencias, volumenes y plazo — respondemos en 24h laborables.",
      ctaForm: "Formulario de cotizacion",
      brandsLabel: "Marcas disponibles",
    };
  }
  return {
    eyebrow: "Mines & carrières · Maroc & Afrique",
    h1: "Mines et carrières : fourniture industrielle et support terrain — Barane Invest",
    heroLead:
      "Fournisseur B2B de pièces d'usure, roulements et convoyeurs pour sites miniers et carrières au Maroc et en Afrique — devis structuré sous 24 h ouvrées.",
    ctaCatalogue: "Voir le catalogue",
    ctaContact: "Demander un devis",
    ctaWhatsapp: "WhatsApp",
    offerTitle: "Notre offre pour les sites miniers",
    offerP1:
      "Barane Invest fournit les pièces critiques qui maintiennent la continuité des opérations sur sites miniers et carrières : concassage, criblage, convoyage et maintenance lourde. Basés à Agadir, nous approvisionnons les bassins phosphatiers (Khouribga, Benguerir), les sites charbon et granulats, avec un accès direct aux références SKF, FAG, Fenner, ContiTech, Siemens, ABB, Parker et Bosch pour l'électrique, l'hydraulique et la pneumatique.",
    offerP2:
      "Que vous ayez besoin d'un remplacement urgent en arrêt de production, d'une consultation multi-références pour appel d'offres ou d'un approvisionnement récurrent sur site isolé, nous structurons sourcing, délais et livraison selon vos contraintes d'exploitation — avec des alternatives techniques lorsqu'une marque unique n'est pas disponible à temps.",
    deliverTitle: "Ce que nous livrons",
    deliverIntro:
      "Chaque catégorie ci-dessous est couverte en sourcing multi-marques, références traçables et livraison sur sites éloignés.",
    categories: [
      {
        icon: Wrench,
        title: "Pièces d'usure",
        text: "Revêtements, marteaux, plaques de frappe, grilles de criblage et revêtements caoutchouc dimensionnés selon votre matériau traité et votre équipement.",
      },
      {
        icon: Settings,
        title: "Roulements et transmissions",
        text: "SKF, FAG, NSK, Timken — billes, rouleaux, rotules et paliers pour convoyeurs, cribles et concasseurs ; toutes références disponibles sur consultation.",
      },
      {
        icon: Truck,
        title: "Bandes transporteuses et convoyeurs",
        text: "Bandes Fenner et ContiTech, rouleaux, tambours et structures — fourniture, remplacement et scénarios de mise à niveau.",
      },
      {
        icon: Package,
        title: "Équipements de manutention",
        text: "Systèmes de levage, palans, chaînes et accessoires pour équipes maintenance et installation sur site.",
      },
      {
        icon: Zap,
        title: "Maintenance et lubrification",
        text: "Graisses, joints, filtration et consommables pour prolonger la durée de vie des organes et limiter les arrêts non planifiés.",
      },
    ] as DeliveryCategory[],
    zonesTitle: "Zones d'intervention",
    zonesIntro:
      "Priorité Maroc et Afrique du Nord / Ouest, avec capacité d'export depuis Agadir vers sites distants.",
    zonesMa:
      "Maroc — Khouribga, Benguerir, Jerada, Bou Craa et autres bassins phosphatiers, charbon et granulats.",
    zonesDz: "Algérie — Annaba, Tlemcen, Béchar et corridors d'approvisionnement minier.",
    zonesAf:
      "Afrique de l'Ouest — Sénégal, Guinée et partenaires régionaux pour livraisons transfrontalières.",
    whyTitle: "Pourquoi choisir Barane Invest pour vos sites miniers",
    whyItems: [
      {
        label: "Réactivité 24 h",
        desc: "Devis structurés et suivi WhatsApp pour les urgences terrain et arrêts critiques.",
      },
      {
        label: "Sourcing multi-marques",
        desc: "Options techniques selon performance, budget et délai — pas un catalogue figé.",
      },
      {
        label: "Livraison sites isolés",
        desc: "Logistique vers sites éloignés, avec appui import-export et dédouanement si nécessaire.",
      },
      {
        label: "Équipe orientée terrain",
        desc: "Spécifications, volumes et fenêtres d'arrêt intégrés à chaque proposition.",
      },
    ],
    relatedTitle: "À voir aussi",
    linkPieces: "Pièces d'usure et criblage — guide technique",
    linkCatalogue: "Catalogue produits industriels",
    ctaTitle: "Besoin d'approvisionnement pour un site minier ou une carrière ?",
    ctaBody:
      "Partagez vos références, volumes et délai — nous répondons sous 24 h ouvrées.",
    ctaForm: "Formulaire de demande de devis",
    brandsLabel: "Marques disponibles",
  };
}

export function MinesCarrieresPageContent({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t = copy(locale);
  const p = pathPrefix;
  const href = (path: string) => (path.startsWith("/") ? `${p}${path}` : path);

  return (
    <>
      <section className="relative min-h-[72vh] overflow-hidden bg-[var(--navy-deep)]">
        <div className="absolute inset-0">
          <Image
            src={sectorMining}
            alt="Site minier — fourniture pièces d'usure mines Maroc"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(105deg, oklch(0.165 0.045 263 / 0.92) 0%, oklch(0.165 0.045 263 / 0.55) 55%, oklch(0.165 0.045 263 / 0.75) 100%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-[1400px] flex-col justify-end px-6 pb-16 pt-28 lg:px-16 lg:pb-20">
          <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
          <h1 className="mt-6 max-w-4xl font-display text-3xl uppercase leading-[0.95] tracking-tight text-[var(--ivory)] sm:text-4xl lg:text-5xl">
            {t.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ivory)]/80">{t.heroLead}</p>
          <div className="mt-8 flex flex-wrap gap-0">
            <Button
              asChild
              className="rounded-none bg-[var(--gold)] px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--navy-deep)] hover:bg-[var(--gold-soft)]"
            >
              <Link href={href("/contact")}>
                {t.ctaContact}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-[var(--ivory)]/30 bg-transparent px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
            >
              <Link href={href("/catalogue")}>{t.ctaCatalogue}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--navy)]/10 bg-[var(--ivory)] py-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 lg:px-16">
          <span className="eyebrow text-[var(--graphite)]/60">{t.brandsLabel}</span>
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="border border-[var(--navy)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--navy)]"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-16">
          <div>
            <span className="eyebrow text-[var(--gold)]">01</span>
            <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.offerTitle}</h2>
          </div>
          <div className="space-y-5 text-[var(--graphite)] leading-relaxed">
            <p>{t.offerP1}</p>
            <p>{t.offerP2}</p>
            <p>
              <Link href={href("/catalogue")} className="font-medium text-[var(--navy)] underline underline-offset-4">
                {t.linkCatalogue}
              </Link>
              {" · "}
              <Link
                href={href("/secteurs/mines-carrieres/pieces-usure-criblage")}
                className="font-medium text-[var(--navy)] underline underline-offset-4"
              >
                {t.linkPieces}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-[var(--ivory)] border-y border-[var(--navy)]/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <span className="eyebrow text-[var(--gold)]">02</span>
          <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.deliverTitle}</h2>
          <p className="mt-4 max-w-2xl text-[var(--graphite)] leading-relaxed">{t.deliverIntro}</p>
          <div className="mt-12 grid gap-px border border-[var(--navy)]/15 bg-[var(--navy)]/15 sm:grid-cols-2 lg:grid-cols-3">
            {t.categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title} className="bg-white p-8 lg:p-10">
                  <Icon className="h-8 w-8 text-[var(--gold)]" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">{cat.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--graphite)]">{cat.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative min-h-[420px] overflow-hidden py-20 lg:min-h-[480px] lg:py-28">
        <div className="absolute inset-0">
          <FadeImage
            src={sectorMining}
            alt="Approvisionnement sites miniers Maroc"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[var(--navy-deep)]/88" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="eyebrow text-[var(--gold)]">03</span>
              <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--ivory)]">{t.zonesTitle}</h2>
              <p className="mt-4 text-[var(--ivory)]/75 leading-relaxed">{t.zonesIntro}</p>
            </div>
            <ul className="space-y-6 border-l border-[var(--gold)]/40 pl-6">
              {[t.zonesMa, t.zonesDz, t.zonesAf].map((zone) => (
                <li key={zone} className="flex gap-3 text-[var(--ivory)]/90 leading-relaxed">
                  <MapPin className="h-5 w-5 shrink-0 text-[var(--gold)] mt-0.5" aria-hidden />
                  {zone}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <span className="eyebrow text-[var(--gold)]">04</span>
          <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.whyTitle}</h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 border border-[var(--navy)]/15">
            {t.whyItems.map((item, i) => (
              <div
                key={item.label}
                className={`p-8 lg:p-10 ${
                  i < t.whyItems.length - 1 ? "border-b sm:border-b-0 sm:border-r border-[var(--navy)]/15" : ""
                } ${i < 2 ? "sm:border-b border-[var(--navy)]/15 lg:border-b-0" : ""}`}
              >
                <div className="font-display text-3xl text-[var(--gold)] leading-none">{item.label}</div>
                <p className="mt-4 text-sm text-[var(--graphite)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--navy-deep)] py-20 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-6 text-center lg:px-16">
          <h2 className="display-xl text-3xl lg:text-4xl text-[var(--ivory)]">{t.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--ivory)]/75">{t.ctaBody}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-none bg-[var(--gold)] px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--navy-deep)]"
            >
              <Link href={href("/contact")}>{t.ctaForm}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-[var(--ivory)]/30 text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
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
