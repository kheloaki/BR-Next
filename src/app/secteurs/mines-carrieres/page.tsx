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
  title: "Mines et carrières",
  description:
    "Solutions de fourniture et support technique pour mines et carrières: pièces d'usure, criblage et maintenance opérationnelle.",
};

export default function MinesCarrieresPage({
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
          bcMines: "Mining and quarries",
          service: {
            name: "Mining and quarry solutions",
            description:
              "Technical support and supply for mining and quarry operations focused on continuity and performance.",
            serviceType: "Industrial mining and quarry support",
          },
          title: "Mining and quarries: supply and field support",
          p1: "BARANE INVEST supports mining and quarry operations with supply and technical support solutions designed to reduce downtime and maintain performance.",
          p2: "We intervene on critical needs including wear parts, screening components, handling equipment and maintenance references, with a continuity-first approach.",
          related: "Related pages",
          back: "Back to Sectors pillar",
          read: "Read: Wear parts and screening in mining environments",
          cta: "Request a proposal for mining site",
          faq: [
            { question: "Which mining and quarry needs do you cover?", answer: "Wear parts, conveying elements, screening solutions and industrial maintenance needs." },
            { question: "Do you intervene on critical shutdowns?", answer: "Yes, we support urgent needs with coordination aligned to production constraints." },
            { question: "Do you offer multiple technical options?", answer: "Yes, we propose alternatives by expected performance, budget and lead time." },
            { question: "How to start a request for a mining site?", answer: "Share specs, volumes and timeline through contact for a site-adapted proposal." },
          ],
        }
      : locale === "es"
        ? {
            bcSecteurs: "Sectores",
            bcMines: "Mineria y canteras",
            service: {
              name: "Soluciones para mineria y canteras",
              description:
                "Soporte tecnico y abastecimiento para operaciones mineras y de canteras con foco en continuidad y rendimiento.",
              serviceType: "Soporte industrial mineria y canteras",
            },
            title: "Mineria y canteras: abastecimiento y soporte en terreno",
            p1: "BARANE INVEST acompana operaciones mineras y de canteras con soluciones de suministro y soporte tecnico para reducir paradas y mantener rendimiento.",
            p2: "Intervenimos en necesidades criticas: piezas de desgaste, cribado, manipulacion y mantenimiento con enfoque en disponibilidad operativa.",
            related: "Paginas relacionadas",
            back: "Volver al pilar Sectores",
            read: "Leer: Piezas de desgaste y cribado en entorno minero",
            cta: "Solicitar propuesta para sitio minero",
            faq: [
              { question: "Que necesidades mineras y de canteras cubren?", answer: "Piezas de desgaste, sistemas de transporte, cribado y mantenimiento industrial." },
              { question: "Intervienen en paradas criticas?", answer: "Si, acompanamos necesidades urgentes coordinadas con explotacion para limitar impacto productivo." },
              { question: "Ofrecen varias opciones tecnicas?", answer: "Si, proponemos alternativas segun rendimiento esperado, presupuesto y plazo." },
              { question: "Como iniciar una solicitud para un sitio minero?", answer: "Comparta especificaciones, volumenes y plazos por contacto para una propuesta adaptada." },
            ],
          }
        : {
            bcSecteurs: "Secteurs",
            bcMines: "Mines et carrières",
            service: {
              name: "Solutions pour mines et carrières",
              description:
                "Support technique et approvisionnement pour opérations minières et carrières avec focus continuité et performance.",
              serviceType: "Support industriel mines et carrières",
            },
            title: "Mines et carrières: approvisionnement et support terrain",
            p1: "BARANE INVEST accompagne les opérations mines et carrières avec des solutions d'approvisionnement et de support technique conçues pour limiter les arrêts et maintenir la performance des installations.",
            p2: "Nous intervenons sur les besoins critiques: pièces d'usure, composants de criblage, équipements de manutention et références de maintenance, avec une logique orientée disponibilité et fiabilité opérationnelle.",
            related: "Pages liées",
            back: "Retour au pilier Secteurs",
            read: "Lire: Pièces d'usure et criblage en environnement minier",
            cta: "Demander une proposition pour site minier",
            faq: [
              { question: "Quels besoins mines et carrières couvrez-vous ?", answer: "Nous couvrons les pièces d'usure, éléments de convoyage, solutions de criblage et besoins de maintenance industrielle." },
              { question: "Intervenez-vous sur des arrêts critiques ?", answer: "Oui, nous accompagnons les besoins urgents en coordination avec l'exploitation pour limiter l'impact sur la production." },
              { question: "Proposez-vous plusieurs options techniques ?", answer: "Oui, nous proposons des alternatives selon performance attendue, budget et délai pour sécuriser la meilleure décision opérationnelle." },
              { question: "Comment lancer une demande pour un site minier ?", answer: "Partagez les spécifications, volumes et délais sur la page contact pour recevoir une proposition adaptée au site." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-secteurs-mines"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcSecteurs, path: "/secteurs" },
            { name: t.bcMines, path: "/secteurs/mines-carrieres" },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd
        id="service-secteurs-mines"
        data={buildServiceSchema({
          ...t.service,
          path: "/secteurs/mines-carrieres",
          pathPrefix,
          locale,
        })}
      />
      <JsonLd id="faq-secteurs-mines" data={buildFaqSchema(t.faq)} />

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
                href="/secteurs/mines-carrieres/pieces-usure-criblage"
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
