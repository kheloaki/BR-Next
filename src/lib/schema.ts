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
  "Groupe industriel marocain spécialisé en fourniture B2B de pièces d'usure, roulements industriels, bandes convoyeuses, moteurs et équipements industriels pour les secteurs mines, BTP, infrastructure et logistique au Maroc et en Afrique.";

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
      "pièces d'usure industrielles",
      "roulements SKF FAG NSK Timken",
      "bandes transporteuses Fenner ContiTech",
      "convoyeurs industriels",
      "moteurs Siemens ABB",
      "hydraulique Parker Bosch",
      "fourniture mines et carrières Maroc",
      "équipement BTP Afrique",
      "import-export industriel",
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
