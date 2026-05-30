"use client";

import Link from "next/link";
import { Download, ExternalLink, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATALOG_PDF_FILENAME, CATALOG_PDF_PATH } from "@/lib/catalog-pdf";
import type { Locale } from "@/lib/i18n";

function copy(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Official catalogue",
      title: "BARANE INVEST industrial catalogue",
      lead: "Browse or download our full B2B catalogue: bearings, belts, hydraulics, motors, wear parts and technical equipment for mining, construction and industry.",
      download: "Download PDF",
      openTab: "Open in new tab",
      viewerHint: "If the preview is slow to load, use download or open in a new tab.",
      quote: "Request a quote",
      whatsapp: "WhatsApp",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Catalogo oficial",
      title: "Catalogo industrial BARANE INVEST",
      lead: "Consulte o descargue nuestro catalogo B2B completo: rodamientos, bandas, hidraulica, motores, piezas de desgaste y equipamiento tecnico.",
      download: "Descargar PDF",
      openTab: "Abrir en nueva pestana",
      viewerHint: "Si la vista previa tarda, use descarga o nueva pestana.",
      quote: "Solicitar cotizacion",
      whatsapp: "WhatsApp",
    };
  }
  return {
    eyebrow: "Catalogue officiel",
    title: "Catalogue industriel BARANE INVEST",
    lead: "Consultez ou téléchargez notre catalogue B2B complet : roulements, bandes, hydraulique, moteurs, pièces d'usure et équipements techniques pour mines, BTP et industrie.",
    download: "Télécharger le PDF",
    openTab: "Ouvrir dans un nouvel onglet",
    viewerHint: "Si l'aperçu met du temps à charger, utilisez le téléchargement ou l'ouverture dans un nouvel onglet.",
    quote: "Demander un devis",
    whatsapp: "WhatsApp",
  };
}

export function CataloguePdfSection({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t = copy(locale);
  const pdfUrl = `${pathPrefix}${CATALOG_PDF_PATH}`;
  const contactHref = `${pathPrefix}/contact`;

  return (
    <section className="bg-[var(--ivory)]">
      <div className="border-b border-[var(--navy)]/10 bg-[var(--navy-deep)] px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-start gap-4">
            <FileText className="h-10 w-10 shrink-0 text-[var(--gold)]" strokeWidth={1.25} aria-hidden />
            <div>
              <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
              <h1 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-tight text-[var(--ivory)] lg:text-4xl">
                {t.title}
              </h1>
              <p className="mt-4 max-w-2xl text-[var(--ivory)]/80 leading-relaxed">{t.lead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-none bg-[var(--gold)] px-6 py-5 text-sm font-semibold uppercase tracking-wider text-[var(--navy-deep)] hover:bg-[var(--gold-soft)]"
                >
                  <a href={pdfUrl} download={CATALOG_PDF_FILENAME}>
                    <Download className="mr-2 h-4 w-4" />
                    {t.download}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-[var(--ivory)]/30 px-6 py-5 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
                >
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t.openTab}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-[var(--ivory)]/30 px-6 py-5 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
                >
                  <Link href={contactHref}>{t.quote}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-none border-[var(--ivory)]/30 px-6 py-5 text-sm font-semibold uppercase tracking-wider text-[var(--ivory)] hover:bg-[var(--ivory)]/10"
                >
                  <a href="https://wa.me/212661656042" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t.whatsapp}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="mb-4 text-center text-xs text-[var(--graphite)]/65">{t.viewerHint}</p>
          <div className="overflow-hidden border border-[var(--navy)]/15 bg-white shadow-sm">
            <iframe
              title={t.title}
              src={`${pdfUrl}#view=FitH`}
              className="h-[min(75vh,900px)] w-full min-h-[480px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
