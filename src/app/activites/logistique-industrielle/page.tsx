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
  title: "Logistique industrielle",
  description:
    "Organisation logistique industrielle pour projets B2B: planification, coordination multisites et continuité d'approvisionnement.",
};

export default function LogistiqueIndustriellePage({
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
          bcLogistics: "Industrial logistics",
          service: {
            name: "B2B industrial logistics",
            description:
              "Industrial project logistics management with flow coordination, delivery tracking and supply continuity.",
            serviceType: "Industrial logistics",
          },
          title: "Industrial logistics for B2B projects",
          p1: "BARANE INVEST structures industrial logistics for B2B projects with clear coordination of flows, deadlines and operational priorities to maintain worksite and production continuity.",
          p2: "We handle delivery planning, field synchronization, critical-point follow-up and adaptation to site constraints with one objective: reducing disruptions and securing execution.",
          related: "Related pages",
          backPillar: "Back to Activities pillar",
          read: "Read: How to reduce delivery lead times on industrial projects",
          cta: "Request a logistics proposal",
          faq: [
            { question: "What does your industrial logistics scope include?", answer: "We cover flow planning, field coordination, delivery tracking and critical supply security." },
            { question: "Can you manage multiple sites simultaneously?", answer: "Yes, we structure multisite logistics plans with clear priorities by zone and phase." },
            { question: "Can you support constrained lead times?", answer: "Yes, we design scenarios for urgent operations based on availability and transport windows." },
            { question: "How can we start a logistics engagement?", answer: "Share your project context, volumes and timeline through contact for a structured proposal." },
          ],
        }
      : locale === "es"
        ? {
            bcActivities: "Actividades",
            bcLogistics: "Logistica industrial",
            service: {
              name: "Logistica industrial B2B",
              description:
                "Gestion logistica de proyectos industriales con coordinacion de flujos, seguimiento de entregas y continuidad de suministro.",
              serviceType: "Logistica industrial",
            },
            title: "Logistica industrial para proyectos B2B",
            p1: "BARANE INVEST organiza la logistica industrial de proyectos B2B con coordinacion clara de flujos, plazos y prioridades para mantener continuidad operativa.",
            p2: "Intervenimos en planificacion de entregas, sincronizacion con equipos de terreno y seguimiento de puntos criticos para reducir rupturas y asegurar ejecucion.",
            related: "Paginas relacionadas",
            backPillar: "Volver al pilar Actividades",
            read: "Leer: Como reducir los plazos de entrega en proyectos industriales",
            cta: "Solicitar propuesta logistica",
            faq: [
              { question: "Que cubre su logistica industrial?", answer: "Cubrimos planificacion de flujos, coordinacion de terreno, seguimiento de entregas y seguridad de suministros criticos." },
              { question: "Pueden gestionar varios sitios a la vez?", answer: "Si, estructuramos planes multisitio con prioridades claras por zona y fase." },
              { question: "Intervienen en plazos exigentes?", answer: "Si, proponemos escenarios adaptados a urgencias segun disponibilidad y transporte." },
              { question: "Como iniciar un acompanamiento logistico?", answer: "Comparta su contexto, volumenes y plazos por contacto para recibir una propuesta estructurada." },
            ],
          }
        : {
            bcActivities: "Activités",
            bcLogistics: "Logistique industrielle",
            service: {
              name: "Logistique industrielle B2B",
              description:
                "Pilotage logistique des projets industriels avec coordination des flux, suivi de livraison et continuité d'approvisionnement.",
              serviceType: "Logistique industrielle",
            },
            title: "Logistique industrielle pour projets B2B",
            p1: "BARANE INVEST organise la logistique industrielle des projets B2B avec une coordination claire des flux, des délais et des priorités opérationnelles afin de maintenir la continuité des chantiers et des sites de production.",
            p2: "Nous intervenons sur la planification des livraisons, la synchronisation avec les équipes terrain, le suivi des points critiques et l'adaptation aux contraintes de chaque site. L'objectif est simple: réduire les ruptures et sécuriser l'exécution.",
            related: "Pages liées",
            backPillar: "Retour au pilier Activités",
            read: "Lire: Comment réduire les délais de livraison sur projet industriel",
            cta: "Demander une proposition logistique",
            faq: [
              { question: "Que couvre votre logistique industrielle ?", answer: "Nous couvrons la planification des flux, la coordination terrain, le suivi des livraisons et la sécurisation des approvisionnements critiques." },
              { question: "Pouvez-vous gérer plusieurs sites en même temps ?", answer: "Oui, nous structurons des plans logistiques multisites avec des priorités claires par zone, étape et criticité." },
              { question: "Intervenez-vous pour des délais contraints ?", answer: "Oui, nous proposons des scénarios adaptés aux urgences opérationnelles selon disponibilité, transport et fenêtres de livraison." },
              { question: "Comment démarrer un accompagnement logistique ?", answer: "Partagez votre contexte projet, vos volumes et vos échéances via la page contact pour une proposition structurée." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-activites-logistique"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcActivities, path: "/activites" },
            { name: t.bcLogistics, path: "/activites/logistique-industrielle" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-activites-logistique"
        data={buildServiceSchema({
          ...t.service,
          path: "/activites/logistique-industrielle",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-activites-logistique" data={buildFaqSchema(t.faq)} />

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
              <Link href="/activites" className="underline underline-offset-4">
                {t.backPillar}
              </Link>
            </li>
            <li>
              <Link
                href="/activites/logistique-industrielle/delais-livraison-projets-industriels"
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
