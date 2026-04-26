import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { Activities } from "@/components/site/Activities";
import { Sectors } from "@/components/site/Sectors";
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
  title: "Activités",
};

export default function ActivitesPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcActivities: "Activities",
          service: {
            name: "Industrial activity domains",
            description:
              "B2B services in construction, infrastructure, logistics, import-export and industrial equipment.",
            serviceType: "Industrial supply and infrastructure services",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "BARANE INVEST supports B2B projects with a multi-sector offer spanning industrial supply, infrastructure works, logistics and operational support across Morocco and Africa.",
          clusters: "Recommended clusters:",
          c1: "Industrial logistics",
          c2: "Industrial import-export",
          faq: [
            {
              question: "Which domains does BARANE INVEST cover?",
              answer:
                "We cover industrial supply, infrastructure, logistics, import-export and technical support for mining and quarry operations.",
            },
            {
              question: "Do you operate only in Morocco?",
              answer:
                "Our core operations are in Morocco, with delivery and support capacity across African projects when required.",
            },
            {
              question: "Can we request a custom offer?",
              answer:
                "Yes, we build offers adapted to sector, volumes and project timelines via our contact channel.",
            },
            {
              question: "What client profiles do you support?",
              answer:
                "We support contractors, industrial firms, logistics operators, mining stakeholders and public/private principals.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcActivities: "Actividades",
            service: {
              name: "Ambitos de actividad industrial",
              description:
                "Servicios B2B en construccion, infraestructura, logistica, import-export y equipamiento industrial.",
              serviceType: "Suministro industrial y servicios de infraestructura",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "BARANE INVEST acompana proyectos B2B con una oferta multisectorial que cubre suministro industrial, infraestructuras, logistica y soporte operativo en Marruecos y Africa.",
            clusters: "Clusters recomendados:",
            c1: "Logistica industrial",
            c2: "Import-export industrial",
            faq: [
              {
                question: "Que actividades cubre BARANE INVEST?",
                answer:
                  "Cubrimos suministro industrial, infraestructuras, logistica, import-export y soporte tecnico para mineria y canteras.",
              },
              {
                question: "Trabajan solo en Marruecos?",
                answer:
                  "Operamos principalmente en Marruecos, con capacidad de entrega y soporte en proyectos africanos segun necesidad.",
              },
              {
                question: "Se puede solicitar una oferta a medida?",
                answer:
                  "Si, preparamos propuestas adaptadas al sector, volumen y calendario del proyecto desde la pagina de contacto.",
              },
              {
                question: "Que tipo de clientes acompanamos?",
                answer:
                  "Acompanamos constructoras, industrias, operadores logisticos, explotaciones mineras y clientes publicos/privados.",
              },
            ],
          }
        : {
            bcActivities: "Activités",
            service: {
              name: "Domaines d'activités industrielles",
              description:
                "Services B2B en construction, infrastructure, logistique, import-export et équipement industriel.",
              serviceType: "Fourniture industrielle et services d'infrastructure",
            },
            faqTitle: "Questions frequentes",
            intro:
              "BARANE INVEST accompagne les projets B2B avec une offre multi-sectorielle couvrant la fourniture industrielle, les travaux d'infrastructure, la logistique et le support opérationnel au Maroc et en Afrique.",
            clusters: "Clusters recommandés:",
            c1: "Logistique industrielle",
            c2: "Import-export industriel",
            faq: [
              {
                question: "Quels domaines couvre BARANE INVEST ?",
                answer:
                  "BARANE INVEST intervient en fourniture industrielle, infrastructures, logistique, import-export et support technique pour mines et carrières.",
              },
              {
                question: "Travaillez-vous uniquement au Maroc ?",
                answer:
                  "Nous opérons principalement au Maroc avec une capacité de livraison et d'accompagnement sur des projets en Afrique selon les besoins clients.",
              },
              {
                question: "Peut-on demander une offre sur mesure ?",
                answer:
                  "Oui, nous préparons des offres adaptées au secteur, au volume et au planning du projet via notre page contact.",
              },
              {
                question: "Quels types de clients accompagnez-vous ?",
                answer:
                  "Nous accompagnons les entreprises BTP, industriels, logisticiens, exploitants miniers et donneurs d'ordre publics ou privés.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-activites"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcActivities, path: "/activites" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-activites"
        data={buildServiceSchema({
          ...t.service,
          path: "/activites",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-activites" data={buildFaqSchema(t.faq)} />
      <Activities locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <Sectors locale={locale} />
      <Projects locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
