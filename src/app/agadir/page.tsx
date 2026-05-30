import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AgadirPageContent } from "@/components/site/AgadirPage";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

const localBusinessDescriptionFr =
  "Fournisseur équipement industriel Agadir : fourniture industrielle, pièces détachées, matériel BTP et équipement mines. Devis 24h, livraison J+1 — Barane Invest, Souss-Massa.";

export const metadata: Metadata = {
  title: "Fournisseur équipement industriel Agadir | BARANE INVEST",
  description:
    "Fourniture industrielle Agadir Maroc : pièces détachées industrielles, matériel BTP, équipement mines. Devis sous 24h, livraison J+1 — Barane Invest.",
  alternates: {
    canonical: "/agadir",
  },
  openGraph: {
    title: "Fournisseur équipement industriel Agadir | BARANE INVEST",
    description:
      "Fourniture industrielle à Agadir : SKF, FAG, Siemens, ABB, Parker, Bosch. Pièces détachées, BTP et mines — devis 24h.",
  },
};

function serviceForLocale(locale: Locale) {
  if (locale === "en") {
    return {
      name: "Industrial equipment supplier Agadir",
      description:
        "B2B industrial supply from Agadir: spare parts, construction equipment and mining references with 24h quotes.",
      serviceType: "Industrial equipment supplier Agadir Morocco",
    };
  }
  if (locale === "es") {
    return {
      name: "Proveedor equipos industriales Agadir",
      description:
        "Suministro industrial B2B desde Agadir: repuestos, construccion y mineria con cotizacion en 24h.",
      serviceType: "Proveedor equipos industriales Agadir Marruecos",
    };
  }
  return {
    name: "Fournisseur équipement industriel Agadir",
    description: localBusinessDescriptionFr,
    serviceType: "Fourniture industrielle Agadir Maroc",
  };
}

function breadcrumbAgadir(locale: Locale) {
  if (locale === "en") return "Agadir industrial supply";
  if (locale === "es") return "Suministro industrial Agadir";
  return "Fourniture industrielle Agadir";
}

export default function AgadirPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const service = serviceForLocale(locale);

  return (
    <>
      <JsonLd
        id="breadcrumb-agadir"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: breadcrumbAgadir(locale), path: "/agadir" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="localbusiness-agadir"
        data={buildLocalBusinessSchema({
          path: "/agadir",
          pathPrefix,
          description: service.description,
        })}
      />
      <JsonLd
        id="service-agadir"
        data={buildServiceSchema({
          ...service,
          path: "/agadir",
          pathPrefix,
          locale,
        })}
      />
      <AgadirPageContent locale={locale} pathPrefix={pathPrefix} />
    </>
  );
}
