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
  title: "Import-export industriel",
  description:
    "Accompagnement import-export pour flux industriels B2B: sourcing, conformité documentaire et coordination logistique.",
};

export default function ImportExportIndustrielPage({
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
          bcImportExport: "Industrial import-export",
          service: {
            name: "B2B industrial import-export",
            description:
              "Import-export services for industrial needs: sourcing, compliance and coordination of international flows.",
            serviceType: "Industrial import-export",
          },
          title: "Industrial import-export for B2B operations",
          p1: "BARANE INVEST supports industrial import-export by aligning sourcing, documentation compliance and logistics coordination to secure flows and reduce lead times.",
          p2: "Our approach combines technical need analysis, supplier selection, documentation preparation and transit follow-up for operationally usable delivery.",
          related: "Related pages",
          back: "Back to Activities pillar",
          read: "Read: Documentation compliance for industrial import",
          cta: "Request an import-export proposal",
          faq: [
            { question: "Which import-export flows do you manage?", answer: "We support equipment, components and industrial consumables flows with project-adapted framing." },
            { question: "Can you help with documentation compliance?", answer: "Yes, we structure required documentation to secure operations and reduce transit blockages." },
            { question: "Do you support urgent needs?", answer: "Yes, we can prioritize critical flows based on product availability and transport constraints." },
            { question: "How do we start an import-export mission?", answer: "Share needs, specs and target timeline through contact for an operational proposal." },
          ],
        }
      : locale === "es"
        ? {
            bcActivities: "Actividades",
            bcImportExport: "Import-export industrial",
            service: {
              name: "Import-export industrial B2B",
              description:
                "Servicios import-export para necesidades industriales: sourcing, conformidad y coordinacion de flujos internacionales.",
              serviceType: "Import-export industrial",
            },
            title: "Import-export industrial para operaciones B2B",
            p1: "BARANE INVEST acompana operaciones de import-export industrial alineando sourcing, conformidad documental y coordinacion logistica para asegurar flujos y reducir plazos.",
            p2: "El enfoque combina analisis tecnico, seleccion de proveedores, preparacion documental y seguimiento de transito para una entrega operativa.",
            related: "Paginas relacionadas",
            back: "Volver al pilar Actividades",
            read: "Leer: Conformidad documental para import industrial",
            cta: "Solicitar propuesta import-export",
            faq: [
              { question: "Que flujos import-export gestionan?", answer: "Acompanamos flujos de equipos, componentes y consumibles industriales segun restricciones del proyecto." },
              { question: "Pueden ayudar con conformidad documental?", answer: "Si, estructuramos la documentacion necesaria para asegurar operaciones y limitar bloqueos de transito." },
              { question: "Intervienen en necesidades urgentes?", answer: "Si, podemos priorizar flujos criticos segun disponibilidad y transporte." },
              { question: "Como iniciar una mision import-export?", answer: "Comparta necesidad, especificaciones y plazo por contacto para recibir propuesta operativa." },
            ],
          }
        : {
            bcActivities: "Activités",
            bcImportExport: "Import-export industriel",
            service: {
              name: "Import-export industriel B2B",
              description:
                "Services import-export pour besoins industriels: sourcing, conformité et coordination des flux internationaux.",
              serviceType: "Import-export industriel",
            },
            title: "Import-export industriel pour opérations B2B",
            p1: "BARANE INVEST accompagne les opérations d'import-export industriel en alignant sourcing, conformité documentaire et coordination logistique pour sécuriser les flux et réduire les délais de mise à disposition.",
            p2: "L'approche combine analyse technique des besoins, sélection fournisseurs, préparation documentaire et suivi de transit afin d'assurer une livraison exploitable dans le cadre des contraintes terrain.",
            related: "Pages liées",
            back: "Retour au pilier Activités",
            read: "Lire: Conformité documentaire pour import industriel",
            cta: "Demander une proposition import-export",
            faq: [
              { question: "Quels flux import-export gérez-vous ?", answer: "Nous accompagnons les flux d'équipements, composants et consommables industriels avec un cadrage adapté aux contraintes projet." },
              { question: "Pouvez-vous aider sur la conformité documentaire ?", answer: "Oui, nous structurons le dossier documentaire requis pour sécuriser les opérations et limiter les blocages de transit." },
              { question: "Intervenez-vous sur des besoins urgents ?", answer: "Oui, nous pouvons prioriser des flux critiques selon disponibilité produit, transport et délais d'exploitation." },
              { question: "Comment démarrer une mission import-export ?", answer: "Partagez votre besoin, vos spécifications et votre échéance via la page contact pour une proposition opérationnelle." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-activites-import-export"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcActivities, path: "/activites" },
            { name: t.bcImportExport, path: "/activites/import-export-industriel" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-activites-import-export"
        data={buildServiceSchema({
          ...t.service,
          path: "/activites/import-export-industriel",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-activites-import-export" data={buildFaqSchema(t.faq)} />

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
                {t.back}
              </Link>
            </li>
            <li>
              <Link
                href="/activites/import-export-industriel/conformite-documentaire-import"
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
