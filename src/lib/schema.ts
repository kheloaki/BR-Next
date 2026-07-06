import { siteUrl } from "@/lib/site-config";
import type { Locale } from "@/lib/i18n";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const organizationDescription =
  "BARANE INVEST est une startup digitale basée à Agadir qui développe, édite et exploite des logiciels métiers, applications web et mobiles, plateformes SaaS, marketplaces et solutions e-commerce, avec des services de transformation digitale, cloud, automatisation, IA, hébergement, maintenance et marketing digital — en complément d'un pôle industriel B2B (fourniture, équipement, logistique) au Maroc et en Afrique.";

const websiteLanguages: Record<Locale, string> = {
  fr: "fr-MA",
  en: "en",
  es: "es",
};

const areaServedLabels: Record<Locale, string> = {
  fr: "Maroc et Afrique",
  en: "Morocco and Africa",
  es: "Marruecos y Africa",
};

/** Home crumb label for JSON-LD breadcrumbs (matches page language). */
export function breadcrumbHomeLabel(locale: Locale): string {
  switch (locale) {
    case "en":
      return "Home";
    case "es":
      return "Inicio";
    default:
      return "Accueil";
  }
}

function absolutePublicPath(pathPrefix: string, path: string): string {
  if (!pathPrefix) {
    return path;
  }
  if (path === "/") {
    return pathPrefix;
  }
  return `${pathPrefix}${path}`;
}

/** Page-specific LocalBusiness JSON-LD (e.g. /agadir landing). */
export function buildLocalBusinessSchema(input: {
  path: string;
  pathPrefix?: string;
  description?: string;
}) {
  const pathPrefix = input.pathPrefix ?? "";
  const pageUrl = `${siteUrl}${absolutePublicPath(pathPrefix, input.path)}`;
  const base = buildOrganizationSchema("fr");
  return {
    ...base,
    "@id": `${pageUrl}#localbusiness`,
    url: pageUrl,
    ...(input.description ? { description: input.description } : {}),
  };
}

export function buildOrganizationSchema(_locale: Locale) {
  const iconUrl = `${siteUrl}/icon.png`;
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    name: "BARANE INVEST",
    alternateName: "Barane Invest",
    url: siteUrl,
    logo: iconUrl,
    image: iconUrl,
    description: organizationDescription,
    telephone: "+212661656042",
    email: "contact@baraneinvest.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Agadir",
      addressLocality: "Agadir",
      addressRegion: "Souss-Massa",
      postalCode: "80000",
      addressCountry: "MA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "30.4278",
      longitude: "-9.5981",
    },
    areaServed: ["MA", "DZ", "SN", "CI", "CM", "GH", "TN", "EG", "ZA"],
    knowsAbout: [
      "développement logiciel sur mesure",
      "applications web et mobiles",
      "plateformes SaaS",
      "marketplaces et e-commerce",
      "transformation digitale",
      "intégration cloud et hébergement",
      "automatisation et intelligence artificielle",
      "analyse de données et tableaux de bord",
      "marketing digital et référencement SEO",
      "création de contenus numériques",
      "fourniture et équipement industriel B2B Maroc",
      "logistique et import-export",
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00",
    },
    sameAs: ["https://www.linkedin.com/company/baraneinvest"],
  };
}

export function buildWebsiteSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BARANE INVEST",
    url: siteUrl,
    inLanguage: websiteLanguages[locale],
  };
}

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
  options?: { pathPrefix?: string },
) {
  const pathPrefix = options?.pathPrefix ?? "";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${absolutePublicPath(pathPrefix, item.path)}`,
    })),
  };
}

export function buildServiceSchema(input: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  pathPrefix?: string;
  locale?: Locale;
}) {
  const pathPrefix = input.pathPrefix ?? "";
  const locale = input.locale ?? "fr";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    provider: {
      "@type": "Organization",
      name: "BARANE INVEST",
      url: siteUrl,
    },
    areaServed: {
      "@type": "Place",
      name: areaServedLabels[locale],
    },
    url: `${siteUrl}${absolutePublicPath(pathPrefix, input.path)}`,
  };
}

export function buildFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
