import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { ContactCTA } from "@/components/site/ContactCTA";
import { About } from "@/components/site/About";
import { Projects } from "@/components/site/Projects";
import { Partners } from "@/components/site/Partners";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcContact: "Contact",
          service: {
            name: "Quote requests and project support",
            description:
              "Entry point for quotes, technical consultation and B2B industrial project support.",
            serviceType: "B2B commercial and technical assistance",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "Contact BARANE INVEST for quote requests and industrial needs: we structure a clear response according to your sector, technical constraints and deadlines.",
          faq: [
            {
              question: "How can I contact BARANE INVEST for a B2B project?",
              answer:
                "Use the contact form to share your need, volumes and deadlines. Our team will respond with a tailored proposal.",
            },
            {
              question: "What details should I provide for an accurate quote?",
              answer:
                "Specify product/service type, quantities, sector, project location and required delivery timeline.",
            },
            {
              question: "Do you handle urgent requests?",
              answer:
                "Yes, depending on availability and project type, we can propose accelerated procurement options.",
            },
            {
              question: "Can you support multisite projects?",
              answer:
                "Yes, we can structure logistics and supply responses for projects deployed across multiple sites.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcContact: "Contacto",
            service: {
              name: "Solicitud de cotizacion y acompanamiento",
              description:
                "Punto de entrada para cotizaciones, consulta tecnica y acompanamiento de proyectos industriales B2B.",
              serviceType: "Asistencia comercial y tecnica B2B",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "Contacte con BARANE INVEST para cotizaciones y necesidades industriales: estructuramos una respuesta clara segun su sector, restricciones tecnicas y plazos.",
            faq: [
              {
                question: "Como contactar a BARANE INVEST para un proyecto B2B?",
                answer:
                  "Use el formulario de contacto para compartir su necesidad, volumenes y plazos. Nuestro equipo respondera con una propuesta adaptada.",
              },
              {
                question: "Que datos debo enviar para una cotizacion precisa?",
                answer:
                  "Indique tipo de producto o servicio, cantidades, sector, ubicacion del proyecto y fecha objetivo.",
              },
              {
                question: "Atienden solicitudes urgentes?",
                answer:
                  "Si, segun disponibilidad y tipo de proyecto, proponemos opciones de abastecimiento acelerado.",
              },
              {
                question: "Pueden apoyar proyectos multisitio?",
                answer:
                  "Si, podemos estructurar una respuesta logistica y de suministro para proyectos en varios sitios.",
              },
            ],
          }
        : {
            bcContact: "Contact",
            service: {
              name: "Demande de devis et accompagnement projet",
              description:
                "Point d'entrée pour demandes de devis, consultation technique et accompagnement de projets industriels B2B.",
              serviceType: "Assistance commerciale et technique B2B",
            },
            faqTitle: "Questions frequentes",
            intro:
              "Contactez BARANE INVEST pour vos demandes de devis et vos besoins industriels : nous structurons une réponse claire selon votre secteur, vos contraintes techniques et vos délais.",
            faq: [
              {
                question: "Comment contacter BARANE INVEST pour un projet B2B ?",
                answer:
                  "Utilisez le formulaire de contact du site pour partager votre besoin, vos volumes et vos délais. Notre équipe vous recontacte avec une proposition adaptée.",
              },
              {
                question: "Quels détails fournir pour obtenir un devis précis ?",
                answer:
                  "Indiquez le type de produit ou service, les quantités, le secteur concerné, la localisation du projet et l'échéance souhaitée.",
              },
              {
                question: "Intervenez-vous sur des besoins urgents ?",
                answer:
                  "Oui, selon la disponibilité et la nature du projet, nous proposons des options d'approvisionnement accéléré.",
              },
              {
                question: "Pouvez-vous accompagner des projets multisites ?",
                answer:
                  "Oui, nous pouvons structurer une réponse logistique et d'approvisionnement pour des projets déployés sur plusieurs sites.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-contact"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcContact, path: "/contact" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-contact"
        data={buildServiceSchema({
          ...t.service,
          path: "/contact",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-contact" data={buildFaqSchema(t.faq)} />
      <About locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <Projects locale={locale} />
      <Partners locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
