import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { PiecesUsureCriblagePageContent } from "@/components/site/sectors/PiecesUsureCriblagePage";
import { breadcrumbHomeLabel, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Pièces d'usure mines criblage Maroc | BARANE INVEST",
  description:
    "Guide pièces d'usure et criblage pour mines et carrières au Maroc : revêtements concasseurs, grilles criblage, bandes Fenner ContiTech. Conseil technique Agadir — devis 24h.",
  alternates: {
    canonical: "/secteurs/mines-carrieres/pieces-usure-criblage",
  },
  openGraph: {
    title: "Pièces d'usure mines criblage Maroc | BARANE INVEST",
    description:
      "Comment choisir revêtements concasseurs et grilles de criblage — fournisseur pièces d'usure mines depuis Agadir.",
  },
};

function faqForLocale(locale: Locale) {
  if (locale === "en") {
    return [
      {
        question: "What are wear parts in a mining plant?",
        answer:
          "Components that absorb abrasion in crushing, screening and conveying — liners, hammers, screen grids, belts and rubber linings, measured in tonnes or operating hours.",
      },
      {
        question: "How to choose crusher wear parts in Morocco?",
        answer:
          "Consider ore abrasiveness, hourly tonnage, crusher type and target replacement cycle. Barane Invest advises on grade, geometry and lead time from Agadir.",
      },
      {
        question: "Do you supply polyurethane and steel screen grids?",
        answer:
          "Yes. We source polyurethane and metal panels for vibrating screens, plus Fenner and ContiTech belts and conveyor rollers.",
      },
      {
        question: "How to request a wear-parts quote?",
        answer:
          "Contact form or WhatsApp +212 661 65 60 42 with references, photos or OEM codes — reply within 24 business hours.",
      },
    ];
  }
  if (locale === "es") {
    return [
      {
        question: "Que son las piezas de desgaste en una mina?",
        answer:
          "Componentes que absorben abrasion en trituracion, cribado y transporte — revestimientos, mallas, bandas y gomas.",
      },
      {
        question: "Como elegir revestimientos de trituradoras?",
        answer:
          "Abrasividad, tonelaje, tipo de trituradora y ciclo de reemplazo. Barane Invest asesora desde Agadir.",
      },
      {
        question: "Suministran mallas de cribado?",
        answer: "Si — poliuretano y metal, bandas Fenner ContiTech y rodillos.",
      },
      {
        question: "Como pedir cotizacion?",
        answer: "Contacto o WhatsApp +212 661 65 60 42 con referencias y plazos.",
      },
    ];
  }
  return [
    {
      question: "Qu'est-ce qu'une pièce d'usure sur un site minier ?",
      answer:
        "C'est un composant soumis à l'abrasion ou l'impact dans le concassage, le criblage ou le convoyage — revêtements, marteaux, grilles, bandes ou godets — dont la durée de vie dépend du tonnage traité.",
    },
    {
      question: "Comment choisir des revêtements de concasseurs au Maroc ?",
      answer:
        "Analysez l'abrasivité du minerai, le tonnage horaire, le type de concasseur et la fréquence de remplacement visée. Barane Invest vous conseille sur le grade, la géométrie et les délais depuis Agadir.",
    },
    {
      question: "Proposez-vous des grilles de criblage pour carrières ?",
      answer:
        "Oui : grilles et panneaux polyuréthane ou métal pour cribles vibrants, bandes Fenner et ContiTech, rouleaux et tambours de convoyeurs.",
    },
    {
      question: "Comment demander un devis pièces d'usure ?",
      answer:
        "Formulaire contact ou WhatsApp +212 661 65 60 42 avec références, photos ou codes constructeur — réponse sous 24 h ouvrées.",
    },
  ];
}

export default function PiecesUsureCriblagePage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const bcSecteurs = locale === "en" ? "Sectors" : locale === "es" ? "Sectores" : "Secteurs";
  const bcMines =
    locale === "en" ? "Mining and quarries" : locale === "es" ? "Mineria y canteras" : "Mines et carrières";
  const bcArticle =
    locale === "en"
      ? "Wear parts and screening"
      : locale === "es"
        ? "Piezas de desgaste y cribado"
        : "Pièces d'usure et criblage";

  return (
    <>
      <JsonLd
        id="breadcrumb-secteurs-mines-pieces"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: bcSecteurs, path: "/secteurs" },
            { name: bcMines, path: "/secteurs/mines-carrieres" },
            {
              name: bcArticle,
              path: "/secteurs/mines-carrieres/pieces-usure-criblage",
            },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd id="faq-secteurs-mines-pieces" data={buildFaqSchema(faqForLocale(locale))} />
      <PiecesUsureCriblagePageContent locale={locale} pathPrefix={pathPrefix} />
    </>
  );
}
