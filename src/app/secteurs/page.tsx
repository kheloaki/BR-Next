import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { Sectors } from "@/components/site/Sectors";
import { Activities } from "@/components/site/Activities";
import { Projects } from "@/components/site/Projects";
import { ContactCTA } from "@/components/site/ContactCTA";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Secteurs",
  description:
    "Secteurs d'intervention BARANE INVEST: mines, carrières, infrastructures et opérations industrielles multisites.",
  openGraph: {
    title: "Secteurs | BARANE INVEST",
    description:
      "Secteurs d'intervention BARANE INVEST: mines, carrières, infrastructures et opérations industrielles multisites.",
  },
  twitter: {
    card: "summary",
    title: "Secteurs | BARANE INVEST",
    description:
      "Secteurs d'intervention BARANE INVEST: mines, carrières, infrastructures et opérations industrielles multisites.",
  },
};

export default function SecteursPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcSecteurs: "Sectors",
          service: {
            name: "Sector-based industrial solutions",
            description:
              "Structured B2B solutions by sector: mining, quarries, construction, infrastructure, industry and logistics.",
            serviceType: "Industrial sector support",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "BARANE INVEST deploys sector-based industrial solutions to answer performance, availability and continuity challenges across B2B projects in Morocco and Africa.",
          clusters: "Recommended clusters:",
          c1: "Mining and quarries",
          c2: "Infrastructure",
          faq: [
            {
              question: "Which sectors are covered by BARANE INVEST?",
              answer:
                "We cover mining, quarries, construction, infrastructure, industry and logistics with supply and operational support solutions.",
            },
            {
              question: "Do you propose different solutions by sector?",
              answer:
                "Yes, each sector receives a dedicated approach based on technical constraints and production objectives.",
            },
            {
              question: "Do you work in difficult environments?",
              answer:
                "Yes, we intervene in demanding contexts including mining sites, infrastructure works and multisite operations.",
            },
            {
              question: "How do you choose the right solution by sector?",
              answer:
                "We assess need, use case, timeline and budget to recommend the most relevant options.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcSecteurs: "Sectores",
            service: {
              name: "Soluciones industriales por sector",
              description:
                "Soluciones B2B por sector: mineria, canteras, construccion, infraestructuras, industria y logistica.",
              serviceType: "Acompanamiento sectorial industrial",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "BARANE INVEST despliega soluciones industriales por sector para responder a retos de rendimiento, disponibilidad y continuidad en proyectos B2B en Marruecos y Africa.",
            clusters: "Clusters recomendados:",
            c1: "Mineria y canteras",
            c2: "Infraestructuras",
            faq: [
              {
                question: "Que sectores cubre BARANE INVEST?",
                answer:
                  "Cubrimos mineria, canteras, construccion, infraestructuras, industria y logistica con soluciones de suministro y soporte operativo.",
              },
              {
                question: "Ofrecen soluciones diferentes segun el sector?",
                answer:
                  "Si, cada sector tiene un enfoque dedicado segun restricciones tecnicas y objetivos de produccion.",
              },
              {
                question: "Trabajan en entornos exigentes?",
                answer:
                  "Si, intervenimos en contextos complejos como sitios mineros, obras de infraestructura y operaciones multisitio.",
              },
              {
                question: "Como eligen la solucion adecuada por sector?",
                answer:
                  "Evaluamos necesidad, uso, plazos y presupuesto para recomendar la opcion mas adecuada.",
              },
            ],
          }
        : {
            bcSecteurs: "Secteurs",
            service: {
              name: "Solutions industrielles par secteur",
              description:
                "Solutions B2B structurées par secteur d'activité : mines, carrières, BTP, infrastructures, industrie et logistique.",
              serviceType: "Accompagnement sectoriel industriel",
            },
            faqTitle: "Questions frequentes",
            intro:
              "BARANE INVEST déploie des solutions industrielles par secteur pour répondre aux enjeux de performance, disponibilité et continuité sur des projets B2B au Maroc et en Afrique.",
            clusters: "Clusters recommandés:",
            c1: "Mines et carrières",
            c2: "Infrastructures",
            faq: [
              {
                question: "Quels secteurs sont couverts par BARANE INVEST ?",
                answer:
                  "Nous couvrons les mines, carrières, BTP, infrastructures, industrie et logistique avec des solutions de fourniture et de support opérationnel.",
              },
              {
                question: "Proposez-vous des solutions différentes selon le secteur ?",
                answer:
                  "Oui, chaque secteur bénéficie d'une approche dédiée selon les contraintes techniques, les niveaux de criticité et les objectifs de production.",
              },
              {
                question: "Travaillez-vous sur des environnements difficiles ?",
                answer:
                  "Oui, nous intervenons sur des contextes exigeants, notamment sites miniers, chantiers d'infrastructure et opérations multisites.",
              },
              {
                question: "Comment choisir la bonne solution par secteur ?",
                answer:
                  "Nous évaluons le besoin, l'usage prévu, les délais et le budget pour recommander les options les plus adaptées au secteur concerné.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-secteurs"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcSecteurs, path: "/secteurs" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-secteurs"
        data={buildServiceSchema({
          ...t.service,
          path: "/secteurs",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-secteurs" data={buildFaqSchema(t.faq)} />
      <Sectors locale={locale} />
      <Activities locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <Projects locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
