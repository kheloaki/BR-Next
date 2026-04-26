import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbHomeLabel, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Pièces d'usure et criblage",
  description:
    "Guide pratique pour choisir pièces d'usure et solutions de criblage adaptées aux contraintes minières et carrières.",
};

export default function PiecesUsureCriblagePage({
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
          bcArticle: "Wear parts and screening",
          title: "Wear parts and screening: field best practices",
          p1: "In mining environments, performance strongly depends on the wear-parts and screening pair. The right fit improves availability and reduces total operating cost.",
          p2: "Recommended strategy combines abrasion analysis, replacement-cycle monitoring and critical-reference standardization to prevent stockouts and long stoppages.",
          links: "Cluster links",
          backCluster: "Back to Mining and quarries cluster",
          backPillar: "Back to Sectors pillar",
          faq: [
            { question: "How to choose suitable wear parts?", answer: "Choice depends on processed material, throughput, abrasiveness and target lifetime." },
            { question: "Which signs indicate imminent replacement?", answer: "Performance drop, abnormal vibration, reduced screening precision and accelerated visual wear." },
            { question: "How to limit screening-related downtime?", answer: "A preventive plan with critical stock and periodic checks of sensitive components reduces downtime." },
            { question: "Should lifetime or purchase cost be prioritized?", answer: "Decisions should use total operating cost, not only initial purchase price." },
          ],
        }
      : locale === "es"
        ? {
            bcSecteurs: "Sectores",
            bcMines: "Mineria y canteras",
            bcArticle: "Piezas de desgaste y cribado",
            title: "Piezas de desgaste y cribado: buenas practicas en terreno",
            p1: "En entorno minero, el rendimiento depende del binomio piezas de desgaste-cribado. Una seleccion adecuada mejora disponibilidad y reduce costo total.",
            p2: "La estrategia recomendada combina analisis de abrasividad, seguimiento de ciclos de reemplazo y estandarizacion de referencias criticas.",
            links: "Enlaces del cluster",
            backCluster: "Volver al cluster Mineria y canteras",
            backPillar: "Volver al pilar Sectores",
            faq: [
              { question: "Como elegir una pieza de desgaste adecuada?", answer: "Depende del material tratado, caudal, abrasividad y objetivo de vida util." },
              { question: "Que senales indican reemplazo inminente?", answer: "Caida de rendimiento, vibracion anormal, perdida de precision y desgaste visual acelerado." },
              { question: "Como limitar paradas por cribado?", answer: "Un plan preventivo con stock critico y control periodico reduce paradas no planificadas." },
              { question: "Priorizar vida util o costo de compra?", answer: "La decision correcta se basa en costo total de explotacion." },
            ],
          }
        : {
            bcSecteurs: "Secteurs",
            bcMines: "Mines et carrières",
            bcArticle: "Pièces d'usure et criblage",
            title: "Pièces d'usure et criblage: bonnes pratiques terrain",
            p1: "En environnement minier, la performance dépend fortement du couple pièces d'usure-criblage. Une sélection adaptée aux contraintes réelles permet d'améliorer la disponibilité et de réduire le coût global d'exploitation.",
            p2: "La stratégie recommandée combine analyse de l'abrasivité, suivi des cycles de remplacement et standardisation des références critiques pour éviter les ruptures et les arrêts prolongés.",
            links: "Liens du cluster",
            backCluster: "Revenir au cluster Mines et carrières",
            backPillar: "Revenir au pilier Secteurs",
            faq: [
              { question: "Comment choisir une pièce d'usure adaptée ?", answer: "Le choix dépend du matériau traité, du débit, de l'abrasivité et des objectifs de durée de vie de la pièce." },
              { question: "Quels signes indiquent un remplacement imminent ?", answer: "Baisse de performance, vibration anormale, perte de précision de criblage et usure visuelle accélérée sont les signaux principaux." },
              { question: "Comment limiter les arrêts liés au criblage ?", answer: "Un plan préventif avec références critiques en stock et contrôle périodique des organes sensibles réduit fortement les arrêts non planifiés." },
              { question: "Faut-il privilégier durée de vie ou coût d'achat ?", answer: "La bonne décision se fait sur le coût total d'exploitation, pas uniquement sur le prix d'achat initial." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-secteurs-mines-pieces"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcSecteurs, path: "/secteurs" },
            { name: t.bcMines, path: "/secteurs/mines-carrieres" },
            {
              name: t.bcArticle,
              path: "/secteurs/mines-carrieres/pieces-usure-criblage",
            },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd id="faq-secteurs-mines-pieces" data={buildFaqSchema(t.faq)} />

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
              <Link href="/secteurs/mines-carrieres" className="underline underline-offset-4">
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
