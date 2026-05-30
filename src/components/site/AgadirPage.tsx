"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Factory,
  HardHat,
  MapPin,
  MessageCircle,
  Mail,
  Mountain,
  Phone,
  Timer,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroIndustrial from "@/assets/hero-industrial.jpg";
import type { Locale } from "@/lib/i18n";

type OfferLine = {
  icon: typeof Mountain;
  title: string;
  text: string;
};

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Agadir · Souss-Massa · Morocco",
      h1: "Industrial supply in Agadir — Barane Invest",
      heroLead:
        "Your local B2B partner for industrial equipment, spare parts and fast quotes — based in Agadir, serving the Souss-Massa region and national projects.",
      s1Title: "Your industrial partner based in Agadir",
      s1P1:
        "Barane Invest is headquartered in Agadir, the economic capital of southern Morocco. Being on the ground means shorter lead times, direct relationships with local buyers and a practical understanding of the regional industrial fabric — from OCP Benguerir phosphate operations to construction firms on the Agadir coast and infrastructure programmes across Souss-Massa.",
      s1P2:
        "As an industrial equipment supplier in Agadir, we structure sourcing, technical validation and delivery for maintenance teams, site managers and procurement departments that cannot afford multi-week waits on critical references. Our proximity allows same-day WhatsApp follow-up, on-site coordination when needed and alignment with local production and shutdown windows.",
      s1P3:
        "Whether you operate a quarry in the Anti-Atlas, a food-processing plant in the urban belt or a public-works yard on a regional road project, you work with a single contact who knows Moroccan industrial supply chains — not a distant call centre.",
      s1P4:
        "Our commercial and technical team understands southern Morocco constraints: port seasonality, mountain site access, short maintenance windows and documentation requirements from public and private owners.",
      s2Title: "Our offer for Agadir and Souss-Massa businesses",
      s2Intro:
        "We cover the sectors that drive the regional economy, with multi-brand sourcing and documented references on every quote.",
      s2P1:
        "Industrial supply in Agadir is not a flat catalogue: we qualify volume, deadline, delivery point and brand constraints before proposing a solution.",
      s2P2:
        "For multi-site groups in the Souss, we centralise repeat orders and anticipate seasonal consumption peaks — especially summer maintenance and coastal construction activity.",
      offers: [
        {
          icon: Mountain,
          title: "Mining and phosphates",
          text: "Supply for OCP partners and extractive sites: wear parts, bearings, belts, screening media and maintenance ranges — equipment for mining operations with delivery to Benguerir, Khouribga corridors and remote sites.",
        },
        {
          icon: HardHat,
          title: "Construction and civil works",
          text: "Building materials and site equipment for Agadir construction firms: handling, electrical, hydraulics and spare parts for concrete plants, crushers and mobile fleets on coastal and inland projects.",
        },
        {
          icon: Factory,
          title: "Food and agro-industry",
          text: "Handling equipment and maintenance for processing lines: motors, drives, conveyors, seals and lubrication to keep production continuity in Souss-Massa agro-industrial zones.",
        },
        {
          icon: Truck,
          title: "Public works",
          text: "Supplies for road and urban infrastructure projects in the Agadir region: structured quotes, volume planning and logistics aligned with contractor schedules.",
        },
      ] as OfferLine[],
      s3Title: "Reference brands available from Agadir",
      s3P1:
        "We source SKF, FAG, NSK and Timken bearings, Fenner and ContiTech conveyor belts, Siemens and ABB electrical equipment, Parker and Bosch hydraulics and pneumatics — available on quote with fast dispatch from our Agadir stock and partner network.",
      s3P2:
        "Industrial spare parts in Agadir are not limited to a single catalogue: we propose technical alternatives by lead time, budget and performance so your maintenance plan stays executable even when a primary brand is out of stock.",
      s3P3:
        "See our product catalogue for families overview; for mining-specific needs, our sector page details field supply and the most requested wear references.",
      brandsLabel: "Brands on quote",
      s4Title: "24-hour response for industrial emergencies in Agadir",
      s4P1:
        "Structured quotes within 24 business hours, J+1 delivery on Agadir for in-stock references, and immediate WhatsApp support for urgent breakdowns. Send OEM codes, photos or dimensions — we reply with a clear proposal, not a generic brochure.",
      s4P2:
        "For multisite groups, we coordinate volumes and delivery slots so Souss-Massa sites receive the same reference quality as national mining or infrastructure programmes — with traceability suitable for audits and tenders.",
      s4Bullets: [
        "Quote within 24 business hours",
        "J+1 delivery on Agadir for stocked items",
        "WhatsApp: +212 661 65 60 42",
        "Technical advice before you order",
      ],
      contactTitle: "Contact us in Agadir",
      contactIntro: "Head office — industrial supply and quotes",
      addressLabel: "Address",
      phoneLabel: "Phone",
      whatsappLabel: "WhatsApp",
      emailLabel: "Email",
      address: "Agadir, Souss-Massa, Morocco",
      phone: "+212 661 65 60 42",
      email: "contact@baraneinvest.com",
      relatedTitle: "Useful links",
      linkCatalogue: "Industrial product catalogue",
      linkMines: "Mining and quarries",
      linkContact: "Quote request",
      ctaTitle: "Need industrial equipment in Agadir?",
      ctaBody: "Describe your references, volumes and deadline — we respond within 24 business hours.",
      ctaButton: "Request a quote",
      ctaWhatsapp: "WhatsApp",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Agadir · Souss-Massa · Marruecos",
      h1: "Suministro industrial en Agadir — Barane Invest",
      heroLead:
        "Su socio B2B local para equipos industriales, repuestos y cotizaciones rapidas — con sede en Agadir, region Souss-Massa y proyectos nacionales.",
      s1Title: "Su socio industrial con base en Agadir",
      s1P1:
        "Barane Invest tiene su sede en Agadir, capital economica del sur marroqui. La proximidad reduce plazos, facilita el seguimiento con compradores locales y el conocimiento del tejido industrial — OCP Benguerir, empresas de construccion en Agadir e infraestructura en Souss-Massa.",
      s1P2:
        "Como proveedor de equipos industriales en Agadir, estructuramos sourcing, validacion tecnica y entrega para equipos de mantenimiento y compras que no pueden esperar semanas en referencias criticas.",
      s1P3:
        "Cantera, planta agroalimentaria u obra publica regional: un unico interlocutor que conoce las cadenas de suministro industrial marroquies.",
      s1P4:
        "Nuestro equipo conoce las restricciones del sur: estacionalidad portuaria, acceso a sitios de montana y ventanas cortas de mantenimiento.",
      s2Title: "Nuestra oferta para empresas de Agadir y Souss-Massa",
      s2Intro: "Sectores clave de la region, con sourcing multimarca y referencias documentadas.",
      s2P1:
        "El suministro industrial en Agadir no es un catalogo plano: calificamos volumen, plazo y lugar de entrega antes de proponer una solucion.",
      s2P2:
        "Para grupos multisitio en el Souss, centralizamos pedidos recurrentes y anticipamos picos de consumo estacional.",
      offers: [
        {
          icon: Mountain,
          title: "Mineria y fosfatos",
          text: "Suministro para OCP y sitios extractivos: piezas de desgaste, rodamientos, bandas y cribado — equipos mineros con entrega a Benguerir y sitios remotos.",
        },
        {
          icon: HardHat,
          title: "Construccion y obra civil",
          text: "Materiales y equipos para constructoras de Agadir: manutencion, electrico, hidraulica y repuestos para plantas y flotas moviles.",
        },
        {
          icon: Factory,
          title: "Agroindustria",
          text: "Equipos de manutencion y mantenimiento para lineas de proceso en la zona agroindustrial de Souss-Massa.",
        },
        {
          icon: Truck,
          title: "Obra publica",
          text: "Suministros para proyectos viales y urbanos en la region de Agadir, con cotizaciones estructuradas y logistica alineada al calendario.",
        },
      ] as OfferLine[],
      s3Title: "Marcas de referencia disponibles desde Agadir",
      s3P1:
        "SKF, FAG, NSK, Timken, Fenner, ContiTech, Siemens, ABB, Parker y Bosch — disponibles bajo cotizacion con envio rapido desde stock en Agadir.",
      s3P2:
        "Repuestos industriales en Agadir con alternativas tecnicas segun plazo, presupuesto y rendimiento.",
      s3P3:
        "Consulte nuestro catalogo de productos; para mineria, nuestra pagina sector detalla el suministro en terreno.",
      brandsLabel: "Marcas bajo cotizacion",
      s4Title: "Respuesta en 24h para urgencias industriales en Agadir",
      s4P1:
        "Cotizacion en 24h laborables, entrega J+1 en Agadir para referencias en stock y WhatsApp inmediato para averias.",
      s4P2:
        "Para grupos multisitio, coordinamos volumenes y ventanas de entrega en Souss-Massa con la misma trazabilidad que en programas mineros o de infraestructura.",
      s4Bullets: [
        "Cotizacion en 24h laborables",
        "Entrega J+1 en Agadir (stock)",
        "WhatsApp: +212 661 65 60 42",
        "Asesoramiento tecnico previo al pedido",
      ],
      contactTitle: "Contacto en Agadir",
      contactIntro: "Sede — suministro industrial y cotizaciones",
      addressLabel: "Direccion",
      phoneLabel: "Telefono",
      whatsappLabel: "WhatsApp",
      emailLabel: "Email",
      address: "Agadir, Souss-Massa, Marruecos",
      phone: "+212 661 65 60 42",
      email: "contact@baraneinvest.com",
      relatedTitle: "Enlaces utiles",
      linkCatalogue: "Catalogo industrial",
      linkMines: "Mineria y canteras",
      linkContact: "Solicitud de cotizacion",
      ctaTitle: "¿Necesita equipos industriales en Agadir?",
      ctaBody: "Indique referencias, volumenes y plazo — respondemos en 24h laborables.",
      ctaButton: "Solicitar cotizacion",
      ctaWhatsapp: "WhatsApp",
    };
  }
  return {
    eyebrow: "Agadir · Souss-Massa · Maroc",
    h1: "Fourniture industrielle à Agadir — Barane Invest",
    heroLead:
      "Votre partenaire B2B local pour l'équipement industriel, les pièces détachées et les devis rapides — implanté à Agadir, au service de la région Souss-Massa et des grands comptes nationaux.",
    s1Title: "Votre partenaire industriel basé à Agadir",
    s1P1:
      "Barane Invest est implanté à Agadir, capitale économique du Sud marocain. Cette proximité se traduit par des délais plus courts, un suivi direct avec les acheteurs locaux et une connaissance concrète du tissu économique régional : filière phosphates OCP Benguerir, entreprises BTP d'Agadir, zones industrielles et projets d'infrastructure portés par la région Souss-Massa.",
    s1P2:
      "En tant que fournisseur équipement industriel Agadir, nous structurons le sourcing, la validation technique et la livraison pour les équipes maintenance, chefs de chantier et services achats qui ne peuvent pas attendre plusieurs semaines sur une référence critique. Notre réactivité permet un suivi WhatsApp le jour même, une coordination terrain si nécessaire et un calage sur vos fenêtres de production ou d'arrêt planifié.",
    s1P3:
      "Que vous exploitiez une carrière dans l'Anti-Atlas, une unité agroalimentaire en périphérie d'Agadir ou un chantier de travaux publics sur un axe routier régional, vous traitez avec un interlocuteur unique qui maîtrise les circuits de fourniture industrielle marocains — pas un centre d'appels éloigné du terrain.",
    s1P4:
      "Notre équipe commerciale et technique connaît les contraintes réelles du Sud : saisonnalité des flux portuaires, accès aux sites en montagne, fenêtres de maintenance courte et exigences documentaires des donneurs d'ordre publics et privés. Cette lecture terrain fait la différence entre un devis « catalogue » et une proposition exécutable sur votre chantier ou votre ligne de production.",
    s2Title: "Notre offre pour les entreprises d'Agadir et de la région Souss-Massa",
    s2Intro:
      "Nous couvrons les secteurs qui structurent l'économie locale, avec un sourcing multimarque et des références documentées sur chaque devis.",
    s2P1:
      "La fourniture industrielle Agadir Maroc ne se résume pas à une liste de références : nous qualifions chaque demande (volume, délai, lieu de livraison, contrainte de marque imposée par le donneur d'ordre) avant de proposer une solution. Les pièces détachées industrielles Agadir sont sourcées auprès de fabricants et distributeurs européens et marocains, avec contrôle des équivalences et traçabilité des certificats lorsque le projet l'exige.",
    s2P2:
      "Pour les industriels qui approvisionnent plusieurs sites dans le Souss, nous centralisons les commandes récurrentes, harmonisons les codes article et réduisons les ruptures en anticipant les consommations saisonnières — notamment sur les campagnes de maintenance estivale et les pics d'activité BTP sur la côte agadirienne.",
    offers: [
      {
        icon: Mountain,
        title: "Mines et phosphates",
        text: "Fourniture pour OCP et sites partenaires : pièces d'usure, roulements, bandes, médias de criblage et gammes maintenance — équipement mines Agadir avec livraison vers Benguerir, corridors Khouribga et sites isolés.",
      },
      {
        icon: HardHat,
        title: "BTP et construction",
        text: "Matériaux et équipements pour chantiers agadiriens : manutention, électrique, hydraulique et pièces détachées pour centrales à béton, concasseurs et parcs mobiles sur projets littoraux et intérieurs — matériel BTP Agadir livré avec devis structuré.",
      },
      {
        icon: Factory,
        title: "Industrie agro-alimentaire",
        text: "Équipements de manutention et maintenance pour lignes de transformation : moteurs, variateurs, convoyeurs, joints et lubrification pour sécuriser la continuité de production dans les zones agro-industrielles du Souss.",
      },
      {
        icon: Truck,
        title: "Travaux publics",
        text: "Fournitures pour projets routiers et urbains région Agadir : planification des volumes, logistique alignée sur le planning entrepreneur et traçabilité des références pour les marchés publics.",
      },
    ] as OfferLine[],
    s3Title: "Des marques de référence disponibles à Agadir",
    s3P1:
      "Nous sourçons les roulements SKF, FAG, NSK et Timken, les bandes Fenner et ContiTech, l'électrique Siemens et ABB, l'hydraulique et la pneumatique Parker et Bosch — disponibles sur devis, avec expédition rapide depuis notre stock Agadir et notre réseau partenaires.",
    s3P2:
      "Les pièces détachées industrielles Agadir ne se limitent pas à un catalogue unique : nous proposons des alternatives techniques selon délai, budget et performance, pour que votre plan de maintenance reste exécutable même lorsqu'une marque principale est en rupture.",
    s3P3:
      "Consultez notre catalogue produits pour une vue d'ensemble des familles (roulements, bandes, hydraulique, moteurs, criblage) ; pour un besoin ciblé mines ou carrières, notre page secteur détaille l'approvisionnement terrain et les références d'usure les plus demandées sur sites extractifs marocains.",
    brandsLabel: "Marques disponibles sur devis",
    s4Title: "Réactif 24h pour vos urgences industrielles à Agadir",
    s4P1:
      "Devis sous 24 h ouvrées, livraison en J+1 sur Agadir pour les références en stock, et support WhatsApp immédiat pour les pannes terrain. Envoyez codes OEM, photos ou cotes — nous répondons avec une proposition claire, pas une plaquette générique.",
    s4P2:
      "Pour les groupes multisites, nous coordonnons volumes et créneaux de livraison afin que les sites Souss-Massa reçoivent la même qualité de référence que les programmes miniers ou infrastructurels nationaux — avec une traçabilité adaptée aux audits et appels d'offres.",
    s4Bullets: [
      "Devis structuré sous 24 h ouvrées",
      "Livraison J+1 sur Agadir (stock)",
      "WhatsApp : +212 661 65 60 42",
      "Conseil technique avant commande",
    ],
    contactTitle: "Nous contacter à Agadir",
    contactIntro: "Siège — fourniture industrielle et devis",
    addressLabel: "Adresse",
    phoneLabel: "Téléphone",
    whatsappLabel: "WhatsApp",
    emailLabel: "Email",
    address: "Agadir, Souss-Massa, Maroc — 80000",
    phone: "+212 661 65 60 42",
    email: "contact@baraneinvest.com",
    relatedTitle: "Liens utiles",
    linkCatalogue: "Catalogue produits industriels",
    linkMines: "Mines et carrières",
    linkContact: "Demande de devis",
    ctaTitle: "Besoin d'équipement industriel à Agadir ?",
    ctaBody:
      "Décrivez vos références, volumes et délai — fourniture industrielle Agadir Maroc avec réponse sous 24 h ouvrées.",
    ctaButton: "Demander un devis",
    ctaWhatsapp: "WhatsApp",
  };
}

const BRANDS = [
  "SKF",
  "FAG",
  "Siemens",
  "ABB",
  "Parker",
  "Bosch",
  "Fenner",
  "ContiTech",
  "NSK",
  "Timken",
];

export function AgadirPageContent({
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
      <section className="relative min-h-[70vh] overflow-hidden bg-[var(--navy-deep)]">
        <div className="absolute inset-0">
          <Image
            src={heroIndustrial}
            alt="Fournisseur équipement industriel Agadir — Barane Invest"
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
        <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-[1400px] flex-col justify-end px-6 pb-16 pt-28 lg:px-16 lg:pb-20">
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
                {t.ctaButton}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-[var(--ivory)]/30 bg-transparent px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
            >
              <a href="https://wa.me/212661656042" target="_blank" rel="noopener noreferrer">
                {t.ctaWhatsapp}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-16">
          <div>
            <span className="eyebrow text-[var(--gold)]">01</span>
            <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.s1Title}</h2>
          </div>
          <div className="space-y-5 text-[var(--graphite)] leading-relaxed">
            <p>{t.s1P1}</p>
            <p>{t.s1P2}</p>
            <p>{t.s1P3}</p>
            {t.s1P4 ? <p>{t.s1P4}</p> : null}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-[var(--ivory)] border-y border-[var(--navy)]/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <span className="eyebrow text-[var(--gold)]">02</span>
          <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.s2Title}</h2>
          <p className="mt-4 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s2Intro}</p>
          {t.s2P1 ? <p className="mt-4 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s2P1}</p> : null}
          {t.s2P2 ? <p className="mt-4 max-w-3xl text-[var(--graphite)] leading-relaxed">{t.s2P2}</p> : null}
          <div className="mt-12 grid gap-px border border-[var(--navy)]/15 bg-[var(--navy)]/15 sm:grid-cols-2">
            {t.offers.map((line) => {
              const Icon = line.icon;
              return (
                <div key={line.title} className="bg-white p-8 lg:p-10">
                  <Icon className="h-8 w-8 text-[var(--gold)]" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">{line.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--graphite)]">{line.text}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-sm text-[var(--graphite)]">
            <Link
              href={href("/secteurs/mines-carrieres")}
              className="font-medium text-[var(--navy)] underline underline-offset-4"
            >
              {t.linkMines}
            </Link>
            {" · "}
            <Link href={href("/catalogue")} className="font-medium text-[var(--navy)] underline underline-offset-4">
              {t.linkCatalogue}
            </Link>
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow text-[var(--gold)]">03</span>
              <h2 className="mt-4 display-xl text-3xl lg:text-4xl text-[var(--navy)]">{t.s3Title}</h2>
              <p className="mt-5 text-[var(--graphite)] leading-relaxed">{t.s3P1}</p>
              <p className="mt-4 text-[var(--graphite)] leading-relaxed">{t.s3P2}</p>
              {t.s3P3 ? <p className="mt-4 text-[var(--graphite)] leading-relaxed">{t.s3P3}</p> : null}
            </div>
            <div>
              <span className="eyebrow text-[var(--graphite)]/60">{t.brandsLabel}</span>
              <div className="mt-4 flex flex-wrap gap-2">
                {BRANDS.map((brand) => (
                  <span
                    key={brand}
                    className="border border-[var(--navy)]/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--navy)]"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-[var(--navy-deep)]">
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
                  <Timer className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-[var(--ivory)] border-y border-[var(--navy)]/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="eyebrow text-[var(--gold)]">
                <Building2 className="mr-2 inline h-4 w-4" aria-hidden />
                {t.contactTitle}
              </span>
              <p className="mt-4 text-[var(--graphite)] leading-relaxed">{t.contactIntro}</p>
            </div>
            <ul className="space-y-5 border border-[var(--navy)]/15 bg-white p-8 lg:p-10">
              <li className="flex gap-4">
                <MapPin className="h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--graphite)]/60">
                    {t.addressLabel}
                  </p>
                  <p className="mt-1 text-[var(--navy)] font-medium">{t.address}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--graphite)]/60">
                    {t.phoneLabel}
                  </p>
                  <a href="tel:+212661656042" className="mt-1 block font-medium text-[var(--navy)] hover:underline">
                    {t.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <MessageCircle className="h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--graphite)]/60">
                    {t.whatsappLabel}
                  </p>
                  <a
                    href="https://wa.me/212661656042"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-medium text-[var(--navy)] hover:underline"
                  >
                    {t.phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--graphite)]/60">
                    {t.emailLabel}
                  </p>
                  <a href={`mailto:${t.email}`} className="mt-1 block font-medium text-[var(--navy)] hover:underline">
                    {t.email}
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--navy)]/10 bg-white py-10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap gap-6 px-6 text-sm lg:px-16">
          <span className="eyebrow text-[var(--graphite)]/60 w-full">{t.relatedTitle}</span>
          <Link href={href("/catalogue")} className="font-medium text-[var(--navy)] underline underline-offset-4">
            {t.linkCatalogue}
          </Link>
          <Link
            href={href("/secteurs/mines-carrieres")}
            className="font-medium text-[var(--navy)] underline underline-offset-4"
          >
            {t.linkMines}
          </Link>
          <Link href={href("/contact")} className="font-medium text-[var(--navy)] underline underline-offset-4">
            {t.linkContact}
          </Link>
        </div>
      </section>

      <section className="bg-[var(--gold)] py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-6 text-center lg:px-16">
          <h2 className="display-xl text-2xl lg:text-3xl text-[var(--navy-deep)]">{t.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[var(--navy-deep)]/80">{t.ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="rounded-none bg-[var(--navy-deep)] px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--navy)]"
            >
              <Link href={href("/contact")}>{t.ctaButton}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-none border-[var(--navy-deep)]/40 bg-transparent px-8 py-6 text-sm font-semibold uppercase tracking-wider text-[var(--navy-deep)]"
            >
              <a href="https://wa.me/212661656042" target="_blank" rel="noopener noreferrer">
                {t.ctaWhatsapp}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
