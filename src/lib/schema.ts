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

const organizationDescriptions: Record<Locale, string> = {
  fr: "Groupe industriel marocain spécialisé en fourniture B2B, infrastructure, logistique et équipement industriel.",
  en: "Moroccan industrial group focused on B2B supply, infrastructure, logistics and industrial equipment.",
  es: "Grupo industrial marroqui especializado en suministro B2B, infraestructura, logistica y equipamiento industrial.",
};

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

export function buildOrganizationSchema(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BARANE INVEST",
    url: siteUrl,
    logo: `${siteUrl}/favicon.ico`,
    description: organizationDescriptions[locale],
    areaServed: ["MA", "Africa"],
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
