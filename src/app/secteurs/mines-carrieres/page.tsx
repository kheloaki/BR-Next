import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { MinesCarrieresPageContent } from "@/components/site/sectors/MinesCarrieresPage";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Fournisseur pièces d'usure mines Maroc | BARANE INVEST",
  description:
    "Approvisionnement sites miniers et carrières au Maroc et en Afrique : pièces d'usure, roulements SKF FAG, bandes Fenner ContiTech, convoyeurs. Devis sous 24h — Agadir.",
  alternates: {
    canonical: "/secteurs/mines-carrieres",
  },
  openGraph: {
    title: "Fournisseur pièces d'usure mines Maroc | BARANE INVEST",
    description:
      "Fourniture B2B pour mines et carrières : pièces d'usure, criblage, convoyeurs. Support terrain depuis Agadir — Maroc et Afrique.",
  },
};

function faqForLocale(locale: Locale) {
  if (locale === "en") {
    return [
      {
        question: "Are you a wear-parts supplier for mines in Morocco?",
        answer:
          "Yes. Barane Invest supplies wear parts, bearings, belts and maintenance references for mining and quarry sites in Morocco and Africa, with quotes within 24 business hours.",
      },
      {
        question: "Which brands do you distribute for mining equipment?",
        answer: "SKF, FAG, NSK, Timken, Fenner, ContiTech, Siemens, ABB, Parker and Bosch for bearings, conveying, electrical and hydraulic needs.",
      },
      {
        question: "Do you deliver to remote mining sites?",
        answer:
          "Yes. We organise logistics to isolated sites in Morocco (Khouribga, Benguerir, Jerada) and West Africa, with import-export support when required.",
      },
      {
        question: "How to request a quote for a mining site?",
        answer:
          "Use the contact form or WhatsApp +212 661 65 60 42 with references, volumes and deadlines for a structured proposal.",
      },
    ];
  }
  if (locale === "es") {
    return [
      {
        question: "¿Son proveedor de piezas de desgaste para minas en Marruecos?",
        answer:
          "Si. Barane Invest suministra piezas de desgaste, rodamientos y bandas para minas y canteras en Marruecos y Africa, con cotizacion en 24h laborables.",
      },
      {
        question: "¿Que marcas distribuyen para equipos mineros?",
        answer: "SKF, FAG, NSK, Timken, Fenner, ContiTech, Siemens, ABB, Parker y Bosch.",
      },
      {
        question: "¿Entregan en sitios mineros aislados?",
        answer: "Si. Organizamos logistica a sitios remotos en Marruecos y Africa occidental.",
      },
      {
        question: "¿Como solicitar cotizacion para un sitio minero?",
        answer: "Formulario de contacto o WhatsApp +212 661 65 60 42 con referencias y plazos.",
      },
    ];
  }
  return [
    {
      question: "Êtes-vous fournisseur de pièces d'usure pour mines au Maroc ?",
      answer:
        "Oui. Barane Invest est fournisseur B2B de pièces d'usure, roulements, bandes transporteuses et références de maintenance pour sites miniers et carrières au Maroc et en Afrique, avec devis structuré sous 24 h ouvrées depuis Agadir.",
    },
    {
      question: "Quelles marques proposez-vous pour l'équipement minier ?",
      answer:
        "Nous distribuons notamment SKF, FAG, NSK, Timken pour les roulements, Fenner et ContiTech pour les convoyeurs, ainsi que Siemens, ABB, Parker et Bosch pour l'électrique, l'hydraulique et la pneumatique.",
    },
    {
      question: "Livrez-vous sur des sites miniers isolés ?",
      answer:
        "Oui. Nous organisons la logistique vers des sites éloignés au Maroc (Khouribga, Benguerir, Jerada, Bou Craa) et en Afrique de l'Ouest, avec appui import-export si nécessaire.",
    },
    {
      question: "Comment demander un devis pour un site minier ou une carrière ?",
      answer:
        "Remplissez le formulaire sur la page contact ou contactez-nous par WhatsApp au +212 661 65 60 42 en précisant références, volumes et délais pour recevoir une proposition adaptée.",
    },
  ];
}

function serviceForLocale(locale: Locale) {
  if (locale === "en") {
    return {
      name: "Mining and quarry industrial supply",
      description:
        "B2B supply and field support for mining and quarry sites: wear parts, bearings, conveying and maintenance.",
      serviceType: "Mining wear parts supplier Morocco",
    };
  }
  if (locale === "es") {
    return {
      name: "Suministro industrial mineria y canteras",
      description:
        "Suministro B2B y soporte en terreno para minas y canteras: piezas de desgaste, rodamientos y transportadores.",
      serviceType: "Proveedor piezas desgaste minas Marruecos",
    };
  }
  return {
    name: "Fourniture industrielle mines et carrières",
    description:
      "Fournisseur pièces d'usure mines Maroc : approvisionnement sites miniers, roulements, convoyeurs et support terrain depuis Agadir.",
    serviceType: "Fournisseur pièces d'usure mines et carrières",
  };
}

export default function MinesCarrieresPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const bcMines =
    locale === "en" ? "Mining and quarries" : locale === "es" ? "Mineria y canteras" : "Mines et carrières";
  const bcSecteurs = locale === "en" ? "Sectors" : locale === "es" ? "Sectores" : "Secteurs";

  return (
    <>
      <JsonLd
        id="breadcrumb-secteurs-mines"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: bcSecteurs, path: "/secteurs" },
            { name: bcMines, path: "/secteurs/mines-carrieres" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-secteurs-mines"
        data={buildServiceSchema({
          ...serviceForLocale(locale),
          path: "/secteurs/mines-carrieres",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-secteurs-mines" data={buildFaqSchema(faqForLocale(locale))} />
      <MinesCarrieresPageContent locale={locale} pathPrefix={pathPrefix} />
    </>
  );
}
