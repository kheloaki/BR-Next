import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { FaqList } from "@/components/seo/SeoContentBlocks";
import { About } from "@/components/site/About";
import { WhyUs } from "@/components/site/WhyUs";
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
  title: "À propos",
};

export default function AboutPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          bcAbout: "About",
          service: {
            name: "BARANE INVEST group presentation",
            description:
              "Overview of BARANE INVEST, a Moroccan industrial group delivering B2B solutions for infrastructure, logistics and equipment projects.",
            serviceType: "B2B industrial consulting and support",
          },
          faqTitle: "Frequently asked questions",
          intro:
            "BARANE INVEST is a Moroccan industrial partner building reliable B2B solutions for supply, infrastructure and logistics, with execution adapted to field constraints.",
          faq: [
            {
              question: "Who is BARANE INVEST?",
              answer:
                "BARANE INVEST is a Moroccan industrial group specialized in B2B supply, operational logistics and infrastructure project support.",
            },
            {
              question: "Which sectors do you support?",
              answer:
                "We support construction, industry, logistics, infrastructure and mining-related operations.",
            },
            {
              question: "What is your project approach?",
              answer:
                "We combine technical framing, multi-brand sourcing and field execution with quality, timeline and continuity focus.",
            },
            {
              question: "Do you work with public and private clients?",
              answer:
                "Yes, we support both public and private principals with context-specific operational responses.",
            },
          ],
        }
      : locale === "es"
        ? {
            bcAbout: "Acerca de",
            service: {
              name: "Presentacion del grupo BARANE INVEST",
              description:
                "Presentacion de BARANE INVEST, grupo industrial marroqui orientado a soluciones B2B para infraestructura, logistica y equipamiento.",
              serviceType: "Asesoramiento y acompanamiento industrial B2B",
            },
            faqTitle: "Preguntas frecuentes",
            intro:
              "BARANE INVEST es un socio industrial marroqui que estructura soluciones B2B fiables para suministro, infraestructura y logistica, con ejecucion adaptada al terreno.",
            faq: [
              {
                question: "Quien es BARANE INVEST?",
                answer:
                  "BARANE INVEST es un grupo industrial marroqui especializado en suministro B2B, logistica operativa y acompanamiento de proyectos de infraestructura.",
              },
              {
                question: "Que sectores atienden?",
                answer:
                  "Intervenimos en construccion, industria, logistica, infraestructuras y actividades mineras.",
              },
              {
                question: "Cual es su enfoque de proyecto?",
                answer:
                  "Combinamos encuadre tecnico, sourcing multimarca y ejecucion en terreno con foco en calidad, plazos y continuidad operativa.",
              },
              {
                question: "Trabajan con clientes publicos y privados?",
                answer:
                  "Si, apoyamos a actores publicos y privados con respuestas adaptadas al contexto operativo y contractual.",
              },
            ],
          }
        : {
            bcAbout: "À propos",
            service: {
              name: "Présentation du groupe BARANE INVEST",
              description:
                "Présentation de BARANE INVEST, groupe industriel marocain orienté solutions B2B pour projets infrastructure, logistique et équipements.",
              serviceType: "Conseil et accompagnement industriel B2B",
            },
            faqTitle: "Questions frequentes",
            intro:
              "BARANE INVEST est un partenaire industriel marocain qui structure des solutions B2B fiables pour la fourniture, l'infrastructure et la logistique, avec une exécution adaptée aux contraintes terrain.",
            faq: [
              {
                question: "Qui est BARANE INVEST ?",
                answer:
                  "BARANE INVEST est un groupe industriel marocain spécialisé dans la fourniture B2B, la logistique opérationnelle et l'accompagnement de projets d'infrastructure.",
              },
              {
                question: "Quels secteurs accompagnez-vous ?",
                answer:
                  "Nous intervenons sur les besoins de la construction, de l'industrie, de la logistique, des infrastructures et des activités minières.",
              },
              {
                question: "Quelle est votre approche projet ?",
                answer:
                  "Nous combinons cadrage technique, sourcing multi-marques et exécution terrain avec un suivi orienté qualité, délai et continuité d'exploitation.",
              },
              {
                question: "Intervenez-vous pour des clients publics et privés ?",
                answer:
                  "Oui, nous accompagnons des donneurs d'ordre publics et privés avec des réponses adaptées au contexte opérationnel et contractuel.",
              },
            ],
          };

  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-about"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcAbout, path: "/about" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-about"
        data={buildServiceSchema({
          ...t.service,
          path: "/about",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-about" data={buildFaqSchema(t.faq)} />
      <About locale={locale} />
      <section className="px-6 lg:px-16 pb-14 lg:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <FaqList title={t.faqTitle} items={t.faq} />
        </div>
      </section>
      <WhyUs locale={locale} />
      <Partners locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
