import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbHomeLabel,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceSchema,
} from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Infrastructures",
  description:
    "Accompagnement des projets d'infrastructure: fournitures techniques, coordination de flux et support d'exécution terrain.",
};

export default function InfrastructuresPage({
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
          bcInfra: "Infrastructure",
          service: {
            name: "Infrastructure project solutions",
            description:
              "B2B support for infrastructure projects with technical supplies and operational coordination.",
            serviceType: "Infrastructure project support",
          },
          title: "Infrastructure: industrial execution and worksite continuity",
          p1: "BARANE INVEST supports infrastructure projects with technical and logistics solutions adapted to execution, lead-time and field coordination constraints.",
          p2: "The objective is to maintain operational pace through a structured method: qualified need, schedule-aligned supply and close follow-up of critical points.",
          related: "Related pages",
          back: "Back to Sectors pillar",
          read: "Read: Multisite worksite supply",
          cta: "Request an infrastructure proposal",
          faq: [
            { question: "Which infrastructure projects do you support?", answer: "Road projects, civil works, technical facilities and multisite operations with execution focus." },
            { question: "Do you intervene during active worksite phases?", answer: "Yes, we support active phases to secure supplies, deadlines and continuity." },
            { question: "How do you adapt to field constraints?", answer: "We tailor solutions to site environment, criticality and delivery schedule." },
            { question: "Can we request initial project framing?", answer: "Yes, through contact we prepare an initial technical and logistics framing." },
          ],
        }
      : locale === "es"
        ? {
            bcSecteurs: "Sectores",
            bcInfra: "Infraestructuras",
            service: {
              name: "Soluciones para proyectos de infraestructura",
              description:
                "Soporte B2B para proyectos de infraestructura con suministros tecnicos y coordinacion operativa.",
              serviceType: "Acompanamiento de infraestructura",
            },
            title: "Infraestructuras: ejecucion industrial y continuidad de obra",
            p1: "BARANE INVEST acompana proyectos de infraestructura con soluciones tecnicas y logisticas adaptadas a restricciones de ejecucion, plazo y coordinacion en terreno.",
            p2: "El objetivo es mantener ritmo operativo con metodo estructurado: necesidad calificada, suministro alineado y seguimiento de puntos criticos.",
            related: "Paginas relacionadas",
            back: "Volver al pilar Sectores",
            read: "Leer: Abastecimiento de obra multisitio",
            cta: "Solicitar propuesta de infraestructura",
            faq: [
              { question: "Que proyectos de infraestructura acompañan?", answer: "Proyectos viales, obras, instalaciones tecnicas y operaciones multisitio con enfoque de ejecucion." },
              { question: "Intervienen en fase activa de obra?", answer: "Si, para asegurar abastecimientos, plazos y continuidad operativa." },
              { question: "Como adaptan la oferta a restricciones de terreno?", answer: "Ajustamos soluciones segun entorno de obra, criticidad y calendario." },
              { question: "Se puede pedir un encuadre inicial?", answer: "Si, por contacto preparamos un encuadre tecnico y logistico inicial." },
            ],
          }
        : {
            bcSecteurs: "Secteurs",
            bcInfra: "Infrastructures",
            service: {
              name: "Solutions pour projets d'infrastructure",
              description:
                "Support B2B pour projets d'infrastructure avec fournitures techniques et coordination opérationnelle.",
              serviceType: "Accompagnement infrastructure",
            },
            title: "Infrastructures: exécution industrielle et continuité chantier",
            p1: "BARANE INVEST accompagne les projets d'infrastructure avec des solutions techniques et logistiques adaptées aux contraintes d'exécution, de délai et de coordination terrain.",
            p2: "L'objectif est de maintenir la cadence opérationnelle grâce à une approche structurée: besoin qualifié, approvisionnement aligné au planning et suivi rigoureux des points critiques chantier.",
            related: "Pages liées",
            back: "Retour au pilier Secteurs",
            read: "Lire: Approvisionnement chantier multisite",
            cta: "Demander une proposition infrastructure",
            faq: [
              { question: "Quels projets d'infrastructure accompagnez-vous ?", answer: "Nous accompagnons les projets routiers, ouvrages, aménagements techniques et opérations multisites avec une approche orientée exécution." },
              { question: "Intervenez-vous en phase chantier active ?", answer: "Oui, nous intervenons en phase active pour sécuriser approvisionnements, délais et continuité opérationnelle." },
              { question: "Comment adaptez-vous l'offre aux contraintes terrain ?", answer: "Nous ajustons les solutions selon environnement chantier, criticité des besoins et calendrier de réalisation." },
              { question: "Peut-on demander un cadrage projet initial ?", answer: "Oui, via la page contact, nous préparons un cadrage initial des besoins techniques et logistiques." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-secteurs-infrastructures"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcSecteurs, path: "/secteurs" },
            { name: t.bcInfra, path: "/secteurs/infrastructures" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-secteurs-infrastructures"
        data={buildServiceSchema({
          ...t.service,
          path: "/secteurs/infrastructures",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-secteurs-infrastructures" data={buildFaqSchema(t.faq)} />

      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl lg:text-5xl font-semibold text-[var(--navy)]">
          {t.title}
        </h1>
        <p className="text-lg text-[var(--graphite)]/85 leading-relaxed">
          {t.p1}
        </p>
        <p className="text-[var(--graphite)]/80 leading-relaxed">
          {t.p2}
        </p>

        <div className="pt-4 border-t border-border space-y-3">
          <h2 className="text-xl font-medium text-[var(--navy)]">{t.related}</h2>
          <ul className="list-disc pl-5 space-y-2 text-[var(--graphite)]/85">
            <li>
              <Link href="/secteurs" className="underline underline-offset-4">
                {t.back}
              </Link>
            </li>
            <li>
              <Link
                href="/secteurs/infrastructures/approvisionnement-chantier-multisite"
                className="underline underline-offset-4"
              >
                {t.read}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="underline underline-offset-4">
                {t.cta}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
