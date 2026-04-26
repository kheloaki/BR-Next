import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { Catalogue } from "@/components/site/Catalogue";
import { Partners } from "@/components/site/Partners";
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
  title: "Catalogue",
};

export default function CataloguePage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcCatalogue: "Catalogue",
          service: {
            name: "Industrial equipment catalogue",
            description:
              "B2B catalogue of equipment, components and technical parts for construction, infrastructure, logistics and industry.",
            serviceType: "Industrial equipment distribution",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "The BARANE INVEST catalogue centralizes industrial solutions for B2B purchasing, with support for technical selection, availability and procurement planning.",
          faq: [
            {
              question: "What does the BARANE INVEST catalogue include?",
              answer:
                "The catalogue includes transmission, hydraulics, screening, motors, logistics accessories and technical industrial equipment.",
            },
            {
              question: "How can I request a catalogue quote?",
              answer:
                "Share your needs via the contact page to receive a proposal aligned with quantities, lead times and specifications.",
            },
            {
              question: "Do you offer multi-brand sourcing?",
              answer:
                "Yes, we work with multi-brand sourcing to match different budgets and operating constraints.",
            },
            {
              question: "Do you secure critical parts availability?",
              answer:
                "We prioritize critical references and adapt procurement flows according to urgency and continuity requirements.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcCatalogue: "Catalogo",
            service: {
              name: "Catalogo de equipos industriales",
              description:
                "Catalogo B2B de equipos, componentes y piezas tecnicas para construccion, infraestructura, logistica e industria.",
              serviceType: "Distribucion de equipamiento industrial",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "El catalogo BARANE INVEST centraliza soluciones industriales para compras B2B, con acompanamiento en seleccion tecnica, disponibilidad y planificacion de abastecimiento.",
            faq: [
              {
                question: "Que incluye el catalogo de BARANE INVEST?",
                answer:
                  "Incluye referencias de transmision, hidraulica, cribado, motores, accesorios logisticos y equipamiento tecnico industrial.",
              },
              {
                question: "Como solicitar una cotizacion del catalogo?",
                answer:
                  "Comparta sus necesidades en la pagina de contacto para recibir una propuesta segun volumen, plazos y especificaciones.",
              },
              {
                question: "Trabajan con varias marcas?",
                answer:
                  "Si, trabajamos con sourcing multimarca para cubrir diferentes presupuestos y restricciones operativas.",
              },
              {
                question: "Aseguran disponibilidad de piezas criticas?",
                answer:
                  "Priorizamos referencias criticas y adaptamos el abastecimiento segun urgencia y continuidad operativa.",
              },
            ],
          }
        : {
            bcCatalogue: "Catalogue",
            service: {
              name: "Catalogue d'équipements industriels",
              description:
                "Catalogue B2B d'équipements, composants et pièces techniques pour construction, infrastructure, logistique et industrie.",
              serviceType: "Distribution d'équipements industriels",
            },
            faqTitle: "Questions frequentes",
            intro:
              "Le catalogue BARANE INVEST centralise des solutions industrielles pour l'achat B2B, avec un accompagnement sur le choix technique, la disponibilité et la planification d'approvisionnement.",
            faq: [
              {
                question: "Que contient le catalogue BARANE INVEST ?",
                answer:
                  "Le catalogue regroupe des références en transmission, hydraulique, criblage, moteurs, accessoires logistiques et équipements techniques industriels.",
              },
              {
                question: "Comment obtenir un devis catalogue ?",
                answer:
                  "Vous pouvez envoyer vos besoins via la page contact pour recevoir une proposition adaptée aux quantités, délais et spécifications demandées.",
              },
              {
                question: "Proposez-vous des marques multiples ?",
                answer:
                  "Oui, nous travaillons en sourcing multi-marques pour couvrir différents budgets et contraintes opérationnelles.",
              },
              {
                question: "Assurez-vous la disponibilité des pièces critiques ?",
                answer:
                  "Nous priorisons les références critiques et mettons en place des solutions d'approvisionnement selon l'urgence et la continuité d'exploitation.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-catalogue"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcCatalogue, path: "/catalogue" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-catalogue"
        data={buildServiceSchema({
          ...t.service,
          path: "/catalogue",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-catalogue" data={buildFaqSchema(t.faq)} />
      <Catalogue locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <Partners locale={locale} />
      <Projects locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
