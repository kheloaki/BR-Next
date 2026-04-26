import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbHomeLabel, buildBreadcrumbSchema, buildFaqSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Conformité documentaire import industriel",
  description:
    "Checklist de conformité documentaire pour opérations d'import industriel: sécuriser transit, dédouanement et délais.",
};

export default function ConformiteDocumentaireImportPage({
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
          bcArticle: "Industrial import documentation compliance",
          title: "Documentation compliance: foundation of reliable industrial import",
          p1: "Documentation compliance is a direct performance lever for import operations: it prevents transit delays, secures customs clearance and protects operational continuity.",
          p2: "A robust method combines document checklists by product type, logistics data validation and compliance control before shipment.",
          links: "Cluster links",
          backCluster: "Back to Industrial import-export cluster",
          backPillar: "Back to Activities pillar",
          faq: [
            { question: "Which documents are critical for industrial import?", answer: "Commercial invoice, packing list, transport documents and product-specific compliance files are critical." },
            { question: "How to avoid administrative blockages?", answer: "Early preparation of required files and cross-checking product data strongly reduce blockages." },
            { question: "When should documentation prep start?", answer: "It should start as soon as the order is validated to align logistics lead times and transit requirements." },
            { question: "Why does compliance impact costs?", answer: "Non-compliance creates delays, additional fees and operational disruption risks." },
          ],
        }
      : locale === "es"
        ? {
            bcActivities: "Actividades",
            bcImportExport: "Import-export industrial",
            bcArticle: "Conformidad documental de importacion industrial",
            title: "Conformidad documental: base de una importacion industrial fiable",
            p1: "La conformidad documental es una palanca directa de rendimiento: evita retrasos de transito, asegura despacho y protege continuidad operativa.",
            p2: "Un enfoque robusto combina checklist por categoria de producto, validacion de datos logisticos y control de conformidad antes del envio.",
            links: "Enlaces del cluster",
            backCluster: "Volver al cluster Import-export industrial",
            backPillar: "Volver al pilar Actividades",
            faq: [
              { question: "Que documentos son criticos para import industrial?", answer: "Factura comercial, packing list, documentos de transporte y conformidad segun tipo de producto." },
              { question: "Como evitar bloqueos administrativos?", answer: "Preparar documentos con antelacion y verificar datos de producto reduce bloqueos." },
              { question: "Cuando iniciar la preparacion documental?", answer: "Desde la validacion del pedido para alinear plazos logisticos y exigencias de transito." },
              { question: "Por que la conformidad afecta costos?", answer: "Una no conformidad genera retrasos, costos extra y riesgo de ruptura operativa." },
            ],
          }
        : {
            bcActivities: "Activités",
            bcImportExport: "Import-export industriel",
            bcArticle: "Conformité documentaire import",
            title: "Conformité documentaire: base de tout import industriel fiable",
            p1: "La conformité documentaire est un levier direct de performance import: elle évite les retards de transit, sécurise le dédouanement et protège la continuité des opérations industrielles.",
            p2: "Une démarche robuste combine checklist documentaire par catégorie produit, validation des informations logistiques, et contrôle des pièces de conformité avant expédition.",
            links: "Liens du cluster",
            backCluster: "Revenir au cluster Import-export industriel",
            backPillar: "Revenir au pilier Activités",
            faq: [
              { question: "Quels documents sont critiques pour un import industriel ?", answer: "Les documents critiques incluent facture commerciale, packing list, documents transport et pièces de conformité selon le type de produit." },
              { question: "Comment éviter les blocages administratifs ?", answer: "La préparation en amont des pièces requises et la vérification croisée des données produit réduisent fortement les blocages." },
              { question: "Quand démarrer la préparation documentaire ?", answer: "La préparation doit démarrer dès la validation de la commande pour aligner délais logistiques et exigences de transit." },
              { question: "Pourquoi la conformité influence-t-elle les coûts ?", answer: "Une non-conformité génère retards, frais additionnels et risques de rupture opérationnelle sur site." },
            ],
          };
  return (
    <div className="pt-24 pb-16 px-6 lg:px-16">
      <JsonLd
        id="breadcrumb-activites-import-export-conformite"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: t.bcActivities, path: "/activites" },
            { name: t.bcImportExport, path: "/activites/import-export-industriel" },
            {
              name: t.bcArticle,
              path: "/activites/import-export-industriel/conformite-documentaire-import",
            },
          ],
          { pathPrefix },
        )}
      />
      <JsonLd id="faq-activites-import-export-conformite" data={buildFaqSchema(t.faq)} />

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
              <Link href="/activites/import-export-industriel" className="underline underline-offset-4">
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
