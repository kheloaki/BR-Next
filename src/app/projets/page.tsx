import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { Projects } from "@/components/site/Projects";
import { Sectors } from "@/components/site/Sectors";
import { Partners } from "@/components/site/Partners";
import { ContactCTA } from "@/components/site/ContactCTA";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Projets",
  description:
    "Exemples de projets B2B accompagnés par BARANE INVEST dans les secteurs industriels et infrastructures.",
  openGraph: {
    title: "Projets | BARANE INVEST",
    description:
      "Exemples de projets B2B accompagnés par BARANE INVEST dans les secteurs industriels et infrastructures.",
  },
  twitter: {
    card: "summary",
    title: "Projets | BARANE INVEST",
    description:
      "Exemples de projets B2B accompagnés par BARANE INVEST dans les secteurs industriels et infrastructures.",
  },
};

export default function ProjetsPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcProjets: "Projects",
          service: {
            name: "Industrial project references",
            description:
              "Industrial and infrastructure project case studies delivered with a B2B execution and reliability focus.",
            serviceType: "Industrial project delivery and management",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "BARANE INVEST projects showcase our ability to execute complex industrial missions, from strategic supply to field support on demanding operations.",
          faq: [
            {
              question: "What type of projects does BARANE INVEST present?",
              answer:
                "We present industrial supply, worksite support and infrastructure-related execution projects.",
            },
            {
              question: "Are these projects only in Morocco?",
              answer:
                "Most showcased projects are in Morocco, with broader intervention capacity across Africa when relevant.",
            },
            {
              question: "What do published case projects highlight?",
              answer:
                "They highlight intervention context, covered needs and BARANE INVEST operational execution capacity.",
            },
            {
              question: "Can we request a similar project assessment?",
              answer:
                "Yes, share your context through contact and we will propose a sector-adapted approach.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcProjets: "Proyectos",
            service: {
              name: "Referencias de proyectos industriales",
              description:
                "Casos de proyectos industriales e infraestructura con enfoque B2B de ejecucion y fiabilidad.",
              serviceType: "Gestion y ejecucion de proyectos industriales",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "Los proyectos de BARANE INVEST demuestran nuestra capacidad para ejecutar misiones industriales complejas, desde suministro estrategico hasta soporte en terreno.",
            faq: [
              {
                question: "Que tipo de proyectos presenta BARANE INVEST?",
                answer:
                  "Presentamos proyectos de suministro industrial, soporte de obra y operaciones de infraestructura y produccion.",
              },
              {
                question: "Estos proyectos se realizan solo en Marruecos?",
                answer:
                  "La mayoria de proyectos mostrados son en Marruecos, con capacidad de intervencion ampliada en Africa.",
              },
              {
                question: "Que muestran las realizaciones publicadas?",
                answer:
                  "Muestran el contexto de intervencion, las necesidades cubiertas y la capacidad de ejecucion operativa de BARANE INVEST.",
              },
              {
                question: "Se puede solicitar un estudio de proyecto similar?",
                answer:
                  "Si, comparta su contexto en la pagina de contacto para una propuesta adaptada a su sector y restricciones.",
              },
            ],
          }
        : {
            bcProjets: "Projets",
            service: {
              name: "Réalisations et cas projets industriels",
              description:
                "Présentation de cas projets industriels et d'infrastructure menés avec une approche B2B orientée exécution et fiabilité.",
              serviceType: "Gestion et exécution de projets industriels",
            },
            faqTitle: "Questions frequentes",
            intro:
              "Les projets BARANE INVEST illustrent notre capacité à exécuter des missions industrielles complexes, de la fourniture stratégique au support terrain sur des opérations exigeantes.",
            faq: [
              {
                question: "Quel type de projets présente BARANE INVEST ?",
                answer:
                  "Nous présentons des projets liés à la fourniture industrielle, au support de chantiers et aux opérations d'infrastructure et de production.",
              },
              {
                question: "Ces projets sont-ils réalisés au Maroc uniquement ?",
                answer:
                  "La majorité des projets affichés concernent le Maroc, avec une capacité d'intervention élargie selon les opportunités en Afrique.",
              },
              {
                question: "Que montrent les réalisations publiées ?",
                answer:
                  "Les réalisations mettent en avant les contextes d'intervention, les besoins couverts et la capacité d'exécution opérationnelle de BARANE INVEST.",
              },
              {
                question: "Peut-on demander une étude de projet similaire ?",
                answer:
                  "Oui, vous pouvez partager votre contexte via la page contact pour une étude adaptée à votre secteur et à vos contraintes.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-projets"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcProjets, path: "/projets" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-projets"
        data={buildServiceSchema({
          ...t.service,
          path: "/projets",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-projets" data={buildFaqSchema(t.faq)} />
      <Projects locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <Sectors locale={locale} />
      <Partners locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
