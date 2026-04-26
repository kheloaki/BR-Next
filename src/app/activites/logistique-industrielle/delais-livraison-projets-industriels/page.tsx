import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbHomeLabel, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Délais de livraison en projet industriel",
  description:
    "Méthodes pratiques pour réduire les délais de livraison sur projets industriels multisites au Maroc.",
};

export default function DelaisLivraisonProjetPage({
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
          bcArticle: "Delivery lead times on industrial projects",
          title: "How to reduce delivery lead times on industrial projects",
          p1: "Reducing industrial lead times requires prioritizing critical parts, planning flows by project milestone, and monitoring deviations daily with rapid decision loops.",
          p2: "An effective model combines reference segmentation, reserved logistics windows, and weekly coordination between procurement, transport and field teams.",
          links: "Cluster links",
          backCluster: "Back to Industrial logistics cluster",
          backPillar: "Back to Activities pillar",
          faq: [
            { question: "Which levers reduce lead times the most?", answer: "Critical-reference prioritization, order anticipation and weekly logistics planning are the strongest levers." },
            { question: "How to handle urgent requests without blocking the project?", answer: "Set up a dedicated urgent lane with fast validation and impact visibility on other lots." },
            { question: "Should stock be centralized or distributed?", answer: "It depends on geography and criticality; a hybrid model is often most resilient." },
            { question: "Which KPI should be tracked first?", answer: "On-time delivery rate for critical references is the priority KPI for performance steering." },
          ],
        }
      : locale === "es"
        ? {
            bcActivities: "Actividades",
            bcLogistics: "Logistica industrial",
            bcArticle: "Plazos de entrega en proyectos industriales",
            title: "Como reducir plazos de entrega en proyectos industriales",
            p1: "Para reducir plazos en contexto industrial, hay que priorizar piezas criticas, planificar flujos por hitos y seguir desajustes con decisiones rapidas.",
            p2: "Un metodo eficaz combina segmentacion de referencias, ventanas logisticas reservadas y coordinacion semanal entre compras, transporte y terreno.",
            links: "Enlaces del cluster",
            backCluster: "Volver al cluster Logistica industrial",
            backPillar: "Volver al pilar Actividades",
            faq: [
              { question: "Que palancas reducen mas los plazos?", answer: "Priorizar referencias criticas, anticipar pedidos y planificacion logistica semanal." },
              { question: "Como gestionar urgencias sin bloquear el proyecto?", answer: "Crear un circuito de urgencias con validacion rapida y visibilidad de impacto." },
              { question: "Centralizar o distribuir stock?", answer: "Depende de geografia y criticidad; un modelo hibrido suele ser el mas resiliente." },
              { question: "Que indicador seguir primero?", answer: "La tasa de entrega en plazo sobre referencias criticas es el KPI principal." },
            ],
          }
        : {
            bcActivities: "Activités",
            bcLogistics: "Logistique industrielle",
            bcArticle: "Délais de livraison projet industriel",
            title: "Comment réduire les délais de livraison sur un projet industriel",
            p1: "Pour réduire les délais de livraison en contexte industriel, il faut prioriser les pièces critiques, planifier les flux par jalon projet et suivre les écarts quotidiennement avec une boucle de décision rapide.",
            p2: "Une méthode efficace combine segmentation des références (critiques, importantes, standards), créneaux logistiques réservés, et coordination hebdomadaire entre achats, transport et équipes terrain. Ce modèle limite les retards en cascade.",
            links: "Liens du cluster",
            backCluster: "Revenir au cluster Logistique industrielle",
            backPillar: "Revenir au pilier Activités",
            faq: [
              { question: "Quels leviers réduisent le plus les délais de livraison ?", answer: "La priorisation des références critiques, l'anticipation des commandes et un planning logistique hebdomadaire sont les leviers les plus efficaces." },
              { question: "Comment gérer les urgences sans bloquer le reste du projet ?", answer: "Il faut un circuit dédié aux urgences avec validation rapide et visibilité sur les impacts pour les autres lots." },
              { question: "Faut-il centraliser ou déployer les stocks ?", answer: "Le choix dépend de la dispersion géographique et de la criticité: souvent un modèle hybride est le plus résilient." },
              { question: "Quel indicateur suivre en priorité ?", answer: "Le taux de livraison dans les délais sur les références critiques est l'indicateur prioritaire pour piloter la performance." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-activites-logistique-delais"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcActivities, path: "/activites" },
            { name: t.bcLogistics, path: "/activites/logistique-industrielle" },
            {
              name: t.bcArticle,
              path: "/activites/logistique-industrielle/delais-livraison-projets-industriels",
            },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd id="faq-activites-logistique-delais" data={buildFaqSchema(t.faq)} />

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
              <Link href="/activites/logistique-industrielle" className="underline underline-offset-4">
                {t.backCluster}
              </Link>
            </li>
            <li>
              <Link href="/activites" className="underline underline-offset-4">
                {t.backPillar}
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </div>
  );
}
