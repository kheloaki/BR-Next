"use client";

import { Download, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { CATALOG_PDF_PATH } from "@/lib/catalog-pdf";
import { usePathname } from "next/navigation";

type FooterLink = { href: string; label: string };

const BRANDS = [
  "SKF",
  "FAG",
  "NSK",
  "Timken",
  "Siemens",
  "ABB",
  "Parker",
  "Bosch",
  "Fenner",
  "ContiTech",
] as const;

function footerCopy(isEnglish: boolean, isSpanish: boolean) {
  if (isEnglish) {
    return {
      description:
        "BARANE INVEST — Agadir-based digital startup: business software, web & mobile apps, SaaS platforms, marketplaces, e-commerce, cloud, automation, AI and digital marketing. Also a B2B industrial division (supply, equipment, logistics) across Morocco and Africa.",
      tagline: "Digital & Industry · Agadir · Morocco & Africa",
      company: "Company",
      digital: "Digital",
      sectors: "Sectors",
      activities: "Activities",
      expertise: "Expertise & products",
      local: "Agadir & Morocco",
      contact: "Contact",
      brands: "Reference brands",
      catalogue: "Product catalogue",
      agadir: "Industrial supply Agadir",
      quote: "Quote request",
      profile: "Download catalogue PDF",
      city: "Agadir, Souss-Massa · Morocco",
      sectorLinks: [
        { href: "/secteurs/mines-carrieres", label: "Mining wear parts Morocco" },
        { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Crusher liners & screen grids" },
        { href: "/secteurs/infrastructures", label: "Infrastructure projects" },
        {
          href: "/secteurs/infrastructures/approvisionnement-chantier-multisite",
          label: "Multisite construction supply",
        },
        { href: "/secteurs", label: "Industrial sectors overview" },
      ] as FooterLink[],
      activityLinks: [
        { href: "/activites/logistique-industrielle", label: "Industrial logistics Morocco" },
        {
          href: "/activites/logistique-industrielle/delais-livraison-projets-industriels",
          label: "Project delivery lead times",
        },
        { href: "/activites/import-export-industriel", label: "Industrial import-export" },
        {
          href: "/activites/import-export-industriel/conformite-documentaire-import",
          label: "Import documentation compliance",
        },
        { href: "/activites", label: "B2B activities" },
        { href: "/services", label: "Digital services" },
      ] as FooterLink[],
      keywordLinks: [
        { href: "/agadir", label: "Industrial equipment supplier Agadir" },
        { href: "/agadir", label: "Industrial spare parts Agadir" },
        { href: "/agadir", label: "Construction equipment Agadir" },
        { href: "/catalogue", label: "SKF FAG bearings Morocco" },
        { href: "/catalogue", label: "Fenner ContiTech conveyor belts" },
        { href: "/catalogue", label: "Siemens ABB industrial motors" },
        { href: "/catalogue", label: "Parker Bosch hydraulics" },
        { href: "/secteurs/mines-carrieres", label: "Mining equipment Morocco" },
        { href: "/secteurs/mines-carrieres", label: "OCP phosphate supply" },
        { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Quarry screening wear parts" },
        { href: "/secteurs/infrastructures", label: "B2B infrastructure supply" },
        { href: "/activites/import-export-industriel", label: "Industrial sourcing Africa" },
        { href: "/activites/logistique-industrielle", label: "Site logistics Morocco" },
        { href: "/contact", label: "Industrial quote 24h" },
        { href: "/catalogue", label: "B2B product catalogue PDF" },
        { href: "/partenaires", label: "Industrial brand partners" },
        { href: "/projets", label: "Reference projects Morocco" },
        { href: "/pourquoi", label: "Why Barane Invest" },
      ] as FooterLink[],
      companyLinks: [
        { href: "/about", label: "About Barane Invest" },
        { href: "/pourquoi", label: "Why choose us" },
        { href: "/partenaires", label: "Partners & brands" },
        { href: "/projets", label: "Projects & references" },
      ] as FooterLink[],
      digitalLinks: [
        { href: "/services", label: "Digital services" },
        { href: "/solutions", label: "SaaS & software" },
        { href: "/solutions", label: "Web & mobile apps" },
        { href: "/solutions", label: "E-commerce & marketplaces" },
        { href: "/services", label: "Cloud & automation" },
      ] as FooterLink[],
      digitalKeywordLinks: [
        { href: "/services", label: "Software development Morocco" },
        { href: "/solutions", label: "SaaS platform Agadir" },
        { href: "/solutions", label: "Mobile app development" },
        { href: "/solutions", label: "E-commerce Morocco" },
        { href: "/services", label: "Digital transformation" },
        { href: "/services", label: "Cloud & hosting" },
        { href: "/services", label: "SEO & digital marketing" },
        { href: "/services", label: "AI & automation" },
      ] as FooterLink[],
      legal: "Legal notice",
      privacy: "Privacy",
    };
  }
  if (isSpanish) {
    return {
      description:
        "BARANE INVEST — startup digital en Agadir, Marruecos: software de gestion, apps web y moviles, plataformas SaaS, marketplaces, e-commerce, cloud, automatizacion, IA y marketing digital. Ademas, una division industrial B2B (suministro, equipos, logistica) en Marruecos y Africa.",
      tagline: "Digital e Industria · Agadir · Marruecos y Africa",
      company: "Empresa",
      digital: "Digital",
      sectors: "Sectores",
      activities: "Actividades",
      expertise: "Expertise y productos",
      local: "Agadir y Marruecos",
      contact: "Contacto",
      brands: "Marcas de referencia",
      catalogue: "Catalogo productos",
      agadir: "Suministro industrial Agadir",
      quote: "Solicitud de cotizacion",
      profile: "Descargar catalogo PDF",
      city: "Agadir, Souss-Massa · Marruecos",
      sectorLinks: [
        { href: "/secteurs/mines-carrieres", label: "Piezas desgaste minas Marruecos" },
        { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Revestimientos y mallas cribado" },
        { href: "/secteurs/infrastructures", label: "Proyectos infraestructura" },
        {
          href: "/secteurs/infrastructures/approvisionnement-chantier-multisite",
          label: "Abastecimiento obra multisitio",
        },
        { href: "/secteurs", label: "Sectores industriales" },
      ] as FooterLink[],
      activityLinks: [
        { href: "/activites/logistique-industrielle", label: "Logistica industrial Marruecos" },
        {
          href: "/activites/logistique-industrielle/delais-livraison-projets-industriels",
          label: "Plazos entrega proyectos",
        },
        { href: "/activites/import-export-industriel", label: "Import-export industrial" },
        {
          href: "/activites/import-export-industriel/conformite-documentaire-import",
          label: "Conformidad documental import",
        },
        { href: "/activites", label: "Actividades B2B" },
        { href: "/services", label: "Servicios digitales" },
      ] as FooterLink[],
      keywordLinks: [
        { href: "/agadir", label: "Proveedor equipos industriales Agadir" },
        { href: "/agadir", label: "Repuestos industriales Agadir" },
        { href: "/agadir", label: "Material obra civil Agadir" },
        { href: "/catalogue", label: "Rodamientos SKF FAG Marruecos" },
        { href: "/catalogue", label: "Bandas Fenner ContiTech" },
        { href: "/catalogue", label: "Motores Siemens ABB industriales" },
        { href: "/catalogue", label: "Hidraulica Parker Bosch" },
        { href: "/secteurs/mines-carrieres", label: "Equipos mineros Marruecos" },
        { href: "/secteurs/mines-carrieres", label: "Suministro fosfatos OCP" },
        { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Piezas desgaste canteras" },
        { href: "/secteurs/infrastructures", label: "Suministro infraestructura B2B" },
        { href: "/activites/import-export-industriel", label: "Sourcing industrial Africa" },
        { href: "/activites/logistique-industrielle", label: "Logistica obra Marruecos" },
        { href: "/contact", label: "Cotizacion industrial 24h" },
        { href: "/catalogue", label: "Catalogo productos PDF B2B" },
        { href: "/partenaires", label: "Socios marcas industriales" },
        { href: "/projets", label: "Proyectos referencia Marruecos" },
        { href: "/pourquoi", label: "Por que Barane Invest" },
      ] as FooterLink[],
      companyLinks: [
        { href: "/about", label: "Acerca de Barane Invest" },
        { href: "/pourquoi", label: "Por que elegirnos" },
        { href: "/partenaires", label: "Socios y marcas" },
        { href: "/projets", label: "Proyectos y referencias" },
      ] as FooterLink[],
      digitalLinks: [
        { href: "/services", label: "Servicios digitales" },
        { href: "/solutions", label: "SaaS y software" },
        { href: "/solutions", label: "Apps web y moviles" },
        { href: "/solutions", label: "E-commerce y marketplaces" },
        { href: "/services", label: "Cloud y automatizacion" },
      ] as FooterLink[],
      digitalKeywordLinks: [
        { href: "/services", label: "Desarrollo de software Marruecos" },
        { href: "/solutions", label: "Plataforma SaaS Agadir" },
        { href: "/solutions", label: "Desarrollo de apps moviles" },
        { href: "/solutions", label: "E-commerce Marruecos" },
        { href: "/services", label: "Transformacion digital" },
        { href: "/services", label: "Cloud y hosting" },
        { href: "/services", label: "SEO y marketing digital" },
        { href: "/services", label: "IA y automatizacion" },
      ] as FooterLink[],
      legal: "Aviso legal",
      privacy: "Privacidad",
    };
  }
  return {
    description:
      "BARANE INVEST — startup digitale à Agadir, Maroc : logiciels métiers, applications web & mobiles, plateformes SaaS, marketplaces, e-commerce, cloud, automatisation, IA et marketing digital. Également un pôle industriel B2B (fourniture, équipement, logistique) au Maroc et en Afrique.",
    tagline: "Digital & Industrie · Agadir · Maroc & Afrique",
    company: "Société",
    digital: "Digital",
    sectors: "Secteurs",
    activities: "Activités",
    expertise: "Expertises & produits",
    local: "Agadir & Maroc",
    contact: "Contact",
    brands: "Marques de référence",
    catalogue: "Catalogue produits",
    agadir: "Fourniture industrielle Agadir",
    quote: "Demande de devis",
    profile: "Télécharger le catalogue PDF",
    city: "Agadir, Souss-Massa · Maroc",
    sectorLinks: [
      { href: "/secteurs/mines-carrieres", label: "Fournisseur pièces d'usure mines Maroc" },
      { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Revêtements concasseurs & grilles criblage" },
      { href: "/secteurs/infrastructures", label: "Projets d'infrastructure industrielle" },
      {
        href: "/secteurs/infrastructures/approvisionnement-chantier-multisite",
        label: "Approvisionnement chantier multisite",
      },
      { href: "/secteurs", label: "Secteurs industriels Maroc" },
    ] as FooterLink[],
    activityLinks: [
      { href: "/activites/logistique-industrielle", label: "Logistique industrielle Maroc" },
      {
        href: "/activites/logistique-industrielle/delais-livraison-projets-industriels",
        label: "Délais livraison projet industriel",
      },
      { href: "/activites/import-export-industriel", label: "Import-export industriel B2B" },
      {
        href: "/activites/import-export-industriel/conformite-documentaire-import",
        label: "Conformité documentaire import",
      },
      { href: "/activites", label: "Activités B2B Barane Invest" },
      { href: "/services", label: "Services digitaux" },
    ] as FooterLink[],
    keywordLinks: [
      { href: "/agadir", label: "Fournisseur équipement industriel Agadir" },
      { href: "/agadir", label: "Fourniture industrielle Agadir Maroc" },
      { href: "/agadir", label: "Pièces détachées industrielles Agadir" },
      { href: "/agadir", label: "Matériel BTP Agadir" },
      { href: "/agadir", label: "Équipement mines Agadir" },
      { href: "/catalogue", label: "Roulements SKF FAG Maroc" },
      { href: "/catalogue", label: "Roulements NSK Timken industriels" },
      { href: "/catalogue", label: "Bandes transporteuses Fenner ContiTech" },
      { href: "/catalogue", label: "Moteurs Siemens ABB industriels" },
      { href: "/catalogue", label: "Hydraulique Parker Bosch Maroc" },
      { href: "/catalogue", label: "Convoyeurs industriels B2B" },
      { href: "/catalogue", label: "Pièces d'usure industrielles Maroc" },
      { href: "/secteurs/mines-carrieres", label: "Équipement mines et carrières" },
      { href: "/secteurs/mines-carrieres", label: "Approvisionnement OCP Benguerir" },
      { href: "/secteurs/mines-carrieres/pieces-usure-criblage", label: "Pièces d'usure mines criblage Maroc" },
      { href: "/secteurs/infrastructures", label: "Fourniture infrastructure Souss-Massa" },
      { href: "/activites/import-export-industriel", label: "Sourcing industriel Afrique" },
      { href: "/activites/logistique-industrielle", label: "Logistique chantier Maroc" },
      { href: "/contact", label: "Devis industriel sous 24h" },
      { href: "/catalogue", label: "Catalogue produits industriels PDF" },
      { href: "/partenaires", label: "Partenaires marques industrielles" },
      { href: "/projets", label: "Projets industriels Maroc Afrique" },
      { href: "/pourquoi", label: "Groupe industriel marocain Agadir" },
    ] as FooterLink[],
    companyLinks: [
      { href: "/about", label: "À propos Barane Invest Agadir" },
      { href: "/pourquoi", label: "Pourquoi Barane Invest" },
      { href: "/partenaires", label: "Partenaires SKF Siemens ABB" },
      { href: "/projets", label: "Références projets B2B" },
    ] as FooterLink[],
    digitalLinks: [
      { href: "/services", label: "Services digitaux" },
      { href: "/solutions", label: "SaaS & logiciels métiers" },
      { href: "/solutions", label: "Applications web & mobiles" },
      { href: "/solutions", label: "E-commerce & marketplaces" },
      { href: "/services", label: "Cloud & automatisation" },
    ] as FooterLink[],
    digitalKeywordLinks: [
      { href: "/services", label: "Développement logiciel Maroc" },
      { href: "/solutions", label: "Plateforme SaaS Agadir" },
      { href: "/solutions", label: "Développement application mobile" },
      { href: "/solutions", label: "Création site e-commerce Maroc" },
      { href: "/services", label: "Transformation digitale PME" },
      { href: "/services", label: "Hébergement cloud & maintenance" },
      { href: "/services", label: "Référencement SEO & marketing digital" },
      { href: "/services", label: "Automatisation & intelligence artificielle" },
    ] as FooterLink[],
    legal: "Mentions légales",
    privacy: "Confidentialité",
  };
}

function FooterLinkList({
  links,
  localizedHref,
  size = "lg",
}: {
  links: FooterLink[];
  localizedHref: (href: string) => string;
  size?: "lg" | "sm";
}) {
  const className =
    size === "lg"
      ? "space-y-3 font-display text-lg lg:text-xl text-[var(--ivory)]"
      : "flex flex-wrap gap-x-4 gap-y-2 text-xs leading-relaxed text-[var(--ivory)]/55";
  return (
    <ul className={className}>
      {links.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          <Link
            href={localizedHref(item.href)}
            className="hover:text-[var(--gold)] transition-colors underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const isSpanish = pathname === "/es" || pathname.startsWith("/es/");
  const localePrefix = isEnglish ? "/en" : isSpanish ? "/es" : pathname === "/fr" || pathname.startsWith("/fr/") ? "/fr" : "";
  const localizedHref = (href: string) => (href === "/" ? localePrefix || "/" : `${localePrefix}${href}`);
  const t = footerCopy(isEnglish, isSpanish);

  return (
    <footer className="bg-[var(--navy-deep)] text-[var(--ivory)]/70 border-t border-[var(--gold)]/20">
      <div className="px-6 lg:px-16 py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid gap-12 lg:gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Image
                src={logoFooter}
                alt="BARANE INVEST — startup digitale et fourniture industrielle Agadir Maroc"
                width={320}
                height={88}
                className="h-20 w-auto object-contain"
              />
              <p className="mt-2 eyebrow text-[var(--gold)]/90">{t.tagline}</p>
              <p className="mt-6 text-sm leading-relaxed max-w-md">{t.description}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {BRANDS.map((brand) => (
                  <span
                    key={brand}
                    className="border border-[var(--ivory)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ivory)]/50"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-6">{t.digital}</h4>
              <FooterLinkList links={t.digitalLinks} localizedHref={localizedHref} />
            </div>

            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-6">{t.company}</h4>
              <FooterLinkList links={t.companyLinks} localizedHref={localizedHref} />
            </div>

            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-6">{t.sectors}</h4>
              <FooterLinkList links={t.sectorLinks} localizedHref={localizedHref} />
            </div>

            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-6">{t.activities}</h4>
              <FooterLinkList links={t.activityLinks} localizedHref={localizedHref} />
            </div>
            </div>

            <div className="lg:col-span-12 grid gap-10 border-t border-[var(--ivory)]/10 pt-12 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-6">{t.local}</h4>
              <ul className="space-y-3 font-display text-lg text-[var(--ivory)]">
                <li>
                  <Link href={localizedHref("/agadir")} className="hover:text-[var(--gold)] transition-colors">
                    {t.agadir}
                  </Link>
                </li>
                <li>
                  <Link href={localizedHref("/catalogue")} className="hover:text-[var(--gold)] transition-colors">
                    {t.catalogue}
                  </Link>
                </li>
                <li>
                  <Link href={localizedHref("/contact")} className="hover:text-[var(--gold)] transition-colors">
                    {t.quote}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="eyebrow text-[var(--gold)] mb-4">{t.contact}</h4>
              <ul className="space-y-2 text-sm">
                <li>{t.city}</li>
                <li>
                  <a href="tel:+212661656042" className="hover:text-[var(--gold)]">
                    +212 661 65 60 42
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/212661656042"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--gold)]"
                  >
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@baraneinvest.com" className="hover:text-[var(--gold)]">
                    contact@baraneinvest.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex items-start">
              <a
                href={CATALOG_PDF_PATH}
                download
                className="inline-flex items-center justify-between gap-4 border border-[var(--gold)]/40 hover:bg-[var(--gold)] hover:text-[var(--navy-deep)] px-5 py-4 transition-all w-full max-w-xs group"
              >
                <span className="eyebrow text-[var(--gold)] group-hover:text-[var(--navy-deep)]">{t.profile}</span>
                <Download className="h-4 w-4 shrink-0" />
              </a>
            </div>
            </div>
          </div>

          <div className="mt-16 lg:mt-20 pt-12 lg:pt-16 border-t border-[var(--ivory)]/10">
            <h4 className="eyebrow text-[var(--gold)] mb-8">{t.digital}</h4>
            <FooterLinkList links={t.digitalKeywordLinks} localizedHref={localizedHref} size="sm" />
          </div>

          <div className="mt-10 pt-8 border-t border-[var(--ivory)]/10">
            <h4 className="eyebrow text-[var(--gold)] mb-8">{t.expertise}</h4>
            <FooterLinkList links={t.keywordLinks} localizedHref={localizedHref} size="sm" />
          </div>

          <div className="mt-10 pt-8 border-t border-[var(--ivory)]/10">
            <p className="eyebrow text-[var(--gold)]/80 mb-4">{t.brands}</p>
            <p className="text-xs leading-relaxed text-[var(--ivory)]/45 max-w-5xl">
              {isEnglish
                ? "Official distribution and sourcing on quote for SKF, FAG, NSK, Timken bearings, Fenner and ContiTech conveyor belts, Siemens and ABB electrical equipment, Parker and Bosch hydraulics — industrial supply Agadir, Morocco, Algeria, Senegal and West Africa."
                : isSpanish
                  ? "Distribucion y sourcing bajo cotizacion para rodamientos SKF, FAG, NSK, Timken, bandas Fenner y ContiTech, equipos Siemens y ABB, hidraulica Parker y Bosch — suministro industrial Agadir, Marruecos y Africa."
                  : "Distribution et sourcing sur devis pour roulements SKF, FAG, NSK, Timken, bandes Fenner et ContiTech, équipements Siemens et ABB, hydraulique Parker et Bosch — fourniture industrielle Agadir, Maroc, Algérie, Sénégal et Afrique de l'Ouest."}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ivory)]/10 px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs eyebrow text-[var(--ivory)]/40">
            © {new Date().getFullYear()} BARANE INVEST · {t.city}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs eyebrow text-[var(--ivory)]/40">
            <Link href={localizedHref("/legal")} className="hover:text-[var(--gold)]">
              {t.legal}
            </Link>
            <Link href={localizedHref("/privacy")} className="hover:text-[var(--gold)]">
              {t.privacy}
            </Link>
            <a
              href="https://www.linkedin.com/company/baraneinvest"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-[var(--gold)] flex items-center gap-2"
            >
              LinkedIn <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
