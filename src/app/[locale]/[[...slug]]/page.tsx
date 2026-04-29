import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import ActivitesPage from "@/app/activites/page";
import CataloguePage from "@/app/catalogue/page";
import ContactPage from "@/app/contact/page";
import LegalPage from "@/app/legal/page";
import PartenairesPage from "@/app/partenaires/page";
import PrivacyPage from "@/app/privacy/page";
import PourquoiPage from "@/app/pourquoi/page";
import ProjetsPage from "@/app/projets/page";
import ServicesPage from "@/app/services/page";
import SecteursPage from "@/app/secteurs/page";
import ActivitesLogistiquePage from "@/app/activites/logistique-industrielle/page";
import ActivitesLogistiqueDelaisPage from "@/app/activites/logistique-industrielle/delais-livraison-projets-industriels/page";
import ActivitesImportExportPage from "@/app/activites/import-export-industriel/page";
import ActivitesImportExportConformitePage from "@/app/activites/import-export-industriel/conformite-documentaire-import/page";
import SecteursMinesPage from "@/app/secteurs/mines-carrieres/page";
import SecteursMinesPiecesPage from "@/app/secteurs/mines-carrieres/pieces-usure-criblage/page";
import SecteursInfrastructuresPage from "@/app/secteurs/infrastructures/page";
import SecteursInfrastructuresApproPage from "@/app/secteurs/infrastructures/approvisionnement-chantier-multisite/page";
import { siteUrl } from "@/lib/site-config";
import { isSupportedLocale, supportedLocales, type Locale } from "@/lib/i18n";

const routeMap = {
  "": true,
  about: true,
  activites: true,
  catalogue: true,
  contact: true,
  legal: true,
  partenaires: true,
  privacy: true,
  pourquoi: true,
  projets: true,
  services: true,
  secteurs: true,
  "activites/logistique-industrielle": true,
  "activites/logistique-industrielle/delais-livraison-projets-industriels": true,
  "activites/import-export-industriel": true,
  "activites/import-export-industriel/conformite-documentaire-import": true,
  "secteurs/mines-carrieres": true,
  "secteurs/mines-carrieres/pieces-usure-criblage": true,
  "secteurs/infrastructures": true,
  "secteurs/infrastructures/approvisionnement-chantier-multisite": true,
} as const;

const localizedMeta: Partial<
  Record<
    keyof typeof routeMap,
    Record<Locale, { title: string; description: string }>
  >
> = {
  "": {
    fr: {
      title: "BARANE INVEST | Groupe industriel B2B",
      description:
        "BARANE INVEST accompagne les projets B2B en logistique, équipements industriels et approvisionnement multisectoriel au Maroc.",
    },
    en: {
      title: "BARANE INVEST | B2B Industrial Group",
      description:
        "BARANE INVEST supports B2B projects with logistics, industrial equipment and multisector sourcing in Morocco.",
    },
    es: {
      title: "BARANE INVEST | Grupo Industrial B2B",
      description:
        "BARANE INVEST acompana proyectos B2B con logistica, equipos industriales y abastecimiento multisectorial en Marruecos.",
    },
  },
  about: {
    fr: {
      title: "À propos | BARANE INVEST",
      description:
        "Découvrez BARANE INVEST, son positionnement industriel B2B, ses expertises terrain et son approche orientée exécution.",
    },
    en: {
      title: "About | BARANE INVEST",
      description:
        "Discover BARANE INVEST, its B2B industrial positioning, field expertise and execution-focused approach.",
    },
    es: {
      title: "Acerca de | BARANE INVEST",
      description:
        "Conozca BARANE INVEST, su posicionamiento industrial B2B, su experiencia en terreno y su enfoque de ejecucion.",
    },
  },
  activites: {
    fr: {
      title: "Activités | BARANE INVEST",
      description:
        "Activités BARANE INVEST: logistique industrielle, import-export et solutions opérationnelles pour projets B2B.",
    },
    en: {
      title: "Activities | BARANE INVEST",
      description:
        "BARANE INVEST activities: industrial logistics, import-export and operational solutions for B2B projects.",
    },
    es: {
      title: "Actividades | BARANE INVEST",
      description:
        "Actividades de BARANE INVEST: logistica industrial, import-export y soluciones operativas para proyectos B2B.",
    },
  },
  catalogue: {
    fr: {
      title: "Catalogue | BARANE INVEST",
      description:
        "Catalogue d'équipements, composants et solutions techniques pour besoins industriels et projets B2B.",
    },
    en: {
      title: "Catalogue | BARANE INVEST",
      description:
        "Catalogue of equipment, components and technical solutions for industrial needs and B2B projects.",
    },
    es: {
      title: "Catalogo | BARANE INVEST",
      description:
        "Catalogo de equipos, componentes y soluciones tecnicas para necesidades industriales y proyectos B2B.",
    },
  },
  contact: {
    fr: {
      title: "Contact | BARANE INVEST",
      description:
        "Contactez BARANE INVEST pour un cadrage de besoin, une proposition technique ou un accompagnement projet.",
    },
    en: {
      title: "Contact | BARANE INVEST",
      description:
        "Contact BARANE INVEST for needs assessment, technical proposal or project support.",
    },
    es: {
      title: "Contacto | BARANE INVEST",
      description:
        "Contacte a BARANE INVEST para definicion de necesidades, propuesta tecnica o acompanamiento de proyecto.",
    },
  },
  legal: {
    fr: {
      title: "Mentions légales | BARANE INVEST",
      description: "Informations légales concernant l'éditeur, l'hébergement et les droits du site BARANE INVEST.",
    },
    en: {
      title: "Legal Notice | BARANE INVEST",
      description: "Legal information about the website publisher, hosting and rights for BARANE INVEST.",
    },
    es: {
      title: "Aviso legal | BARANE INVEST",
      description: "Informacion legal sobre el editor del sitio, el alojamiento y los derechos de BARANE INVEST.",
    },
  },
  partenaires: {
    fr: {
      title: "Partenaires | BARANE INVEST",
      description:
        "Nos partenaires industriels et techniques au service de la performance opérationnelle des projets B2B.",
    },
    en: {
      title: "Partners | BARANE INVEST",
      description:
        "Industrial and technical partners supporting operational performance across B2B projects.",
    },
    es: {
      title: "Socios | BARANE INVEST",
      description:
        "Socios industriales y tecnicos al servicio del rendimiento operativo de proyectos B2B.",
    },
  },
  privacy: {
    fr: {
      title: "Confidentialité | BARANE INVEST",
      description: "Politique de confidentialité de BARANE INVEST sur la collecte et l'usage des données du formulaire.",
    },
    en: {
      title: "Privacy | BARANE INVEST",
      description: "BARANE INVEST privacy policy on collection and use of contact form data.",
    },
    es: {
      title: "Privacidad | BARANE INVEST",
      description: "Politica de privacidad de BARANE INVEST sobre recopilacion y uso de datos del formulario.",
    },
  },
  pourquoi: {
    fr: {
      title: "Pourquoi nous | BARANE INVEST",
      description:
        "Pourquoi choisir BARANE INVEST: expertise terrain, réactivité opérationnelle et approche orientée résultats.",
    },
    en: {
      title: "Why Us | BARANE INVEST",
      description:
        "Why choose BARANE INVEST: field expertise, operational responsiveness and results-driven delivery.",
    },
    es: {
      title: "Por que nosotros | BARANE INVEST",
      description:
        "Por que elegir BARANE INVEST: experiencia en terreno, reactividad operativa y orientacion a resultados.",
    },
  },
  projets: {
    fr: {
      title: "Projets | BARANE INVEST",
      description:
        "Exemples de projets B2B accompagnés par BARANE INVEST dans les secteurs industriels et infrastructures.",
    },
    en: {
      title: "Projects | BARANE INVEST",
      description:
        "Examples of B2B projects supported by BARANE INVEST across industrial and infrastructure sectors.",
    },
    es: {
      title: "Proyectos | BARANE INVEST",
      description:
        "Ejemplos de proyectos B2B acompanados por BARANE INVEST en sectores industriales e infraestructura.",
    },
  },
  services: {
    fr: {
      title: "Services digitaux | BARANE INVEST",
      description:
        "Développement logiciel, transformation digitale et marketing digital pour accélérer vos opérations B2B.",
    },
    en: {
      title: "Digital Services | BARANE INVEST",
      description:
        "Software development, digital transformation and growth marketing services for B2B operations.",
    },
    es: {
      title: "Servicios digitales | BARANE INVEST",
      description:
        "Desarrollo de software, transformacion digital y marketing digital para impulsar operaciones B2B.",
    },
  },
  secteurs: {
    fr: {
      title: "Secteurs | BARANE INVEST",
      description:
        "Secteurs d'intervention BARANE INVEST: mines, carrières, infrastructures et opérations industrielles multisites.",
    },
    en: {
      title: "Sectors | BARANE INVEST",
      description:
        "BARANE INVEST sectors: mining, quarries, infrastructure and multisite industrial operations.",
    },
    es: {
      title: "Sectores | BARANE INVEST",
      description:
        "Sectores de BARANE INVEST: mineria, canteras, infraestructura y operaciones industriales multisitio.",
    },
  },
  "activites/logistique-industrielle": {
    fr: {
      title: "Logistique industrielle",
      description:
        "Coordination logistique industrielle pour projets B2B: planification des flux, suivi des livraisons et continuité opérationnelle.",
    },
    en: {
      title: "Industrial Logistics",
      description:
        "Industrial logistics coordination for B2B projects: flow planning, delivery tracking and operational continuity.",
    },
    es: {
      title: "Logistica Industrial",
      description:
        "Coordinacion logistica industrial para proyectos B2B: planificacion de flujos, seguimiento de entregas y continuidad operativa.",
    },
  },
  "activites/logistique-industrielle/delais-livraison-projets-industriels": {
    fr: {
      title: "Délais de livraison projet industriel",
      description:
        "Méthodes concrètes pour réduire les délais de livraison sur projets industriels: priorisation, planning et pilotage des écarts.",
    },
    en: {
      title: "Industrial Project Delivery Lead Times",
      description:
        "Practical methods to reduce delivery lead times on industrial projects through prioritization, planning and deviation control.",
    },
    es: {
      title: "Plazos de Entrega en Proyectos Industriales",
      description:
        "Metodos practicos para reducir plazos de entrega en proyectos industriales con priorizacion, planificacion y control de desviaciones.",
    },
  },
  "activites/import-export-industriel": {
    fr: {
      title: "Import-export industriel",
      description:
        "Import-export industriel B2B: sourcing, conformité documentaire et coordination logistique pour sécuriser les flux.",
    },
    en: {
      title: "Industrial Import-Export",
      description:
        "B2B industrial import-export: sourcing, documentation compliance and logistics coordination to secure flows.",
    },
    es: {
      title: "Import-Export Industrial",
      description:
        "Import-export industrial B2B: sourcing, conformidad documental y coordinacion logistica para asegurar flujos.",
    },
  },
  "activites/import-export-industriel/conformite-documentaire-import": {
    fr: {
      title: "Conformité documentaire import industriel",
      description:
        "Guide de conformité documentaire pour import industriel: checklists, contrôle des pièces et réduction des blocages.",
    },
    en: {
      title: "Industrial Import Documentation Compliance",
      description:
        "Documentation compliance guide for industrial import: checklists, document controls and reduced transit blockages.",
    },
    es: {
      title: "Conformidad Documental de Importacion Industrial",
      description:
        "Guia de conformidad documental para importacion industrial: checklists, control documental y menos bloqueos.",
    },
  },
  "secteurs/mines-carrieres": {
    fr: {
      title: "Mines et carrières",
      description:
        "Solutions d'approvisionnement et support terrain pour sites miniers et carrières: pièces, maintenance et continuité d'exploitation.",
    },
    en: {
      title: "Mining and Quarries",
      description:
        "Supply and field support solutions for mining and quarry sites: parts, maintenance and operational continuity.",
    },
    es: {
      title: "Mineria y Canteras",
      description:
        "Soluciones de abastecimiento y soporte en terreno para mineria y canteras: piezas, mantenimiento y continuidad operativa.",
    },
  },
  "secteurs/mines-carrieres/pieces-usure-criblage": {
    fr: {
      title: "Pièces d'usure et criblage",
      description:
        "Bonnes pratiques pour sélectionner pièces d'usure et solutions de criblage en environnement minier.",
    },
    en: {
      title: "Wear Parts and Screening",
      description:
        "Best practices for selecting wear parts and screening solutions in mining environments.",
    },
    es: {
      title: "Piezas de Desgaste y Cribado",
      description:
        "Buenas practicas para seleccionar piezas de desgaste y soluciones de cribado en entorno minero.",
    },
  },
  "secteurs/infrastructures": {
    fr: {
      title: "Infrastructures",
      description:
        "Accompagnement des projets d'infrastructure avec solutions techniques, logistiques et coordination d'exécution.",
    },
    en: {
      title: "Infrastructure",
      description:
        "Support for infrastructure projects with technical solutions, logistics coordination and execution follow-up.",
    },
    es: {
      title: "Infraestructuras",
      description:
        "Acompanamiento de proyectos de infraestructura con soluciones tecnicas, coordinacion logistica y seguimiento de ejecucion.",
    },
  },
  "secteurs/infrastructures/approvisionnement-chantier-multisite": {
    fr: {
      title: "Approvisionnement chantier multisite",
      description:
        "Méthode d'approvisionnement multisite pour projets d'infrastructure: priorisation, séquencement et pilotage des flux.",
    },
    en: {
      title: "Multisite Worksite Supply",
      description:
        "Multisite supply method for infrastructure projects: prioritization, sequencing and flow control.",
    },
    es: {
      title: "Abastecimiento de Obra Multisitio",
      description:
        "Metodo de abastecimiento multisitio para infraestructura: priorizacion, secuenciacion y control de flujos.",
    },
  },
};

function buildPath(locale: string, key: string) {
  if (!key) {
    return `/${locale}`;
  }
  return `/${locale}/${key}`;
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const key = slug?.join("/") ?? "";

  if (!isSupportedLocale(locale)) {
    return {};
  }
  if (!(key in routeMap)) {
    return {};
  }

  const canonicalPath = buildPath(locale, key);
  const frPath = buildPath("fr", key);
  const enPath = buildPath("en", key);
  const esPath = buildPath("es", key);
  const defaultPath = key ? `/${key}` : "/";
  const metaForRoute = localizedMeta[key as keyof typeof routeMap]?.[locale as Locale];

  return {
    title: metaForRoute?.title,
    description: metaForRoute?.description,
    alternates: {
      canonical: `${siteUrl}${canonicalPath}`,
      languages: {
        fr: `${siteUrl}${frPath}`,
        en: `${siteUrl}${enPath}`,
        es: `${siteUrl}${esPath}`,
        "x-default": `${siteUrl}${defaultPath}`,
      },
    },
  };
}

export default async function LocalePage(props: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { locale, slug } = await props.params;
  const key = slug?.join("/") ?? "";

  if (!supportedLocales.includes(locale as Locale)) {
    notFound();
  }

  if (!(key in routeMap)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const pathPrefix = `/${currentLocale}`;
  switch (key) {
    case "":
      return <HomePage locale={currentLocale} />;
    case "about":
      return <AboutPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "activites":
      return <ActivitesPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "catalogue":
      return <CataloguePage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "contact":
      return <ContactPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "legal":
      return <LegalPage locale={currentLocale} />;
    case "partenaires":
      return <PartenairesPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "privacy":
      return <PrivacyPage locale={currentLocale} />;
    case "pourquoi":
      return <PourquoiPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "projets":
      return <ProjetsPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "services":
      return <ServicesPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "secteurs":
      return <SecteursPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "activites/logistique-industrielle":
      return <ActivitesLogistiquePage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "activites/logistique-industrielle/delais-livraison-projets-industriels":
      return <ActivitesLogistiqueDelaisPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "activites/import-export-industriel":
      return <ActivitesImportExportPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "activites/import-export-industriel/conformite-documentaire-import":
      return <ActivitesImportExportConformitePage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "secteurs/mines-carrieres":
      return <SecteursMinesPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "secteurs/mines-carrieres/pieces-usure-criblage":
      return <SecteursMinesPiecesPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "secteurs/infrastructures":
      return <SecteursInfrastructuresPage locale={currentLocale} pathPrefix={pathPrefix} />;
    case "secteurs/infrastructures/approvisionnement-chantier-multisite":
      return <SecteursInfrastructuresApproPage locale={currentLocale} pathPrefix={pathPrefix} />;
    default:
      notFound();
  }
}
