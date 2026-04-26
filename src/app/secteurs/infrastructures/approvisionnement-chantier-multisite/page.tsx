import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbHomeLabel, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Approvisionnement chantier multisite",
  description:
    "Méthode d'approvisionnement multisite pour projets d'infrastructure: priorisation, séquencement et sécurisation des flux.",
};

export default function ApprovisionnementChantierMultisitePage({
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
          bcArticle: "Multisite worksite supply",
          title: "Multisite worksite supply: operational method",
          p1: "On multisite projects, high-performing supply depends on clear prioritization of critical needs, delivery sequencing and regular deviation steering.",
          p2: "A consolidated schedule, site-level visibility and fast reallocation rules help prevent shortages that slow overall project progress.",
          links: "Cluster links",
          backCluster: "Back to Infrastructure cluster",
          backPillar: "Back to Sectors pillar",
          faq: [
            { question: "Why is multisite supply more complex?", answer: "Multiple delivery points and work rhythms increase mismatch and shortage risks." },
            { question: "What is the first improvement lever?", answer: "Prioritizing critical needs by site and project phase is the key first lever." },
            { question: "How to reduce inter-site delays?", answer: "A weekly reviewed consolidated flow calendar helps anticipate tensions and reallocate quickly." },
            { question: "Which KPI should be tracked?", answer: "On-time delivery rate for critical items by site is the most useful KPI." },
          ],
        }
      : locale === "es"
        ? {
            bcSecteurs: "Sectores",
            bcInfra: "Infraestructuras",
            bcArticle: "Abastecimiento de obra multisitio",
            title: "Abastecimiento de obra multisitio: metodo operativo",
            p1: "En obras multisitio, un abastecimiento eficaz requiere priorizacion clara de necesidades criticas, secuenciacion de entregas y seguimiento regular de desajustes.",
            p2: "Calendario consolidado, visibilidad por sitio y reglas de reasignacion rapidas evitan rupturas que frenan el avance global.",
            links: "Enlaces del cluster",
            backCluster: "Volver al cluster Infraestructuras",
            backPillar: "Volver al pilar Sectores",
            faq: [
              { question: "Por que una obra multisitio complica el abastecimiento?", answer: "Multiples puntos de entrega y ritmos de obra aumentan riesgos de desajuste y ruptura." },
              { question: "Cual es la primera palanca de mejora?", answer: "Priorizar necesidades criticas por sitio y fase estabiliza la ejecucion." },
              { question: "Como reducir retrasos entre sitios?", answer: "Un calendario consolidado revisado semanalmente permite anticipar tensiones y reasignar recursos." },
              { question: "Que indicador conviene seguir?", answer: "La tasa de entrega a tiempo en articulos criticos por sitio es el KPI mas util." },
            ],
          }
        : {
            bcSecteurs: "Secteurs",
            bcInfra: "Infrastructures",
            bcArticle: "Approvisionnement chantier multisite",
            title: "Approvisionnement chantier multisite: méthode opérationnelle",
            p1: "Sur un chantier multisite, l'approvisionnement performant repose sur une priorisation claire des besoins critiques, un séquencement des livraisons et un pilotage régulier des écarts.",
            p2: "La combinaison d'un planning consolidé, d'une visibilité par site et de règles de réallocation rapides permet d'éviter les ruptures qui ralentissent l'avancement global du projet.",
            links: "Liens du cluster",
            backCluster: "Revenir au cluster Infrastructures",
            backPillar: "Revenir au pilier Secteurs",
            faq: [
              { question: "Pourquoi un chantier multisite complique-t-il l'approvisionnement ?", answer: "La multiplicité des points de livraison et des rythmes chantier augmente les risques de décalage et de rupture." },
              { question: "Quel est le premier levier d'amélioration ?", answer: "La priorisation des besoins critiques par site et par phase chantier est le premier levier pour stabiliser l'exécution." },
              { question: "Comment réduire les retards inter-sites ?", answer: "Un calendrier consolidé des flux, revu chaque semaine, permet d'anticiper les tensions et de réallouer rapidement les ressources." },
              { question: "Quel indicateur suivre pour piloter ?", answer: "Le taux de livraison à l'heure sur articles critiques par site reste l'indicateur le plus utile pour piloter." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-secteurs-infrastructures-appro"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcSecteurs, path: "/secteurs" },
            { name: t.bcInfra, path: "/secteurs/infrastructures" },
            {
              name: t.bcArticle,
              path: "/secteurs/infrastructures/approvisionnement-chantier-multisite",
            },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd id="faq-secteurs-infrastructures-appro" data={buildFaqSchema(t.faq)} />

      <article className="max-w-4xl mx-auto space-y-6">
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
          <h2 className="text-xl font-medium text-[var(--navy)]">{t.links}</h2>
          <ul className="list-disc pl-5 space-y-2 text-[var(--graphite)]/85">
            <li>
              <Link href="/secteurs/infrastructures" className="underline underline-offset-4">
                {t.backCluster}
              </Link>
            </li>
            <li>
              <Link href="/secteurs" className="underline underline-offset-4">
                {t.backPillar}
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
