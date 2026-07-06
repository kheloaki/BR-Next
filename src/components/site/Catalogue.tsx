"use client";

import { ArrowRight, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CATALOG_PDF_FILENAME, CATALOG_PDF_PATH } from "@/lib/catalog-pdf";
import catScreening from "@/assets/cat-screening.jpg";
import catMotors from "@/assets/cat-motors.jpg";
import catBearings from "@/assets/cat-bearings.jpg";
import catHydraulic from "@/assets/cat-hydraulic.jpg";
import type { Locale } from "@/lib/i18n";

export function Catalogue({
  locale = "fr",
  variant = "section",
}: {
  locale?: Locale;
  /** section = homepage block; below-pdf = families grid under catalogue PDF page */
  variant?: "section" | "below-pdf";
}) {
  const prefix = locale === "en" ? "/en" : locale === "es" ? "/es" : "";
  const pdfHref = `${prefix}${CATALOG_PDF_PATH}`;

  const featured =
    locale === "en"
      ? [
          { img: catScreening, title: "Screening & conveyors", count: "Belts · Rollers · Drums" },
          { img: catMotors, title: "Motors & reducers", count: "Electric · Industrial" },
          { img: catBearings, title: "Bearings & transmissions", count: "All brands" },
          { img: catHydraulic, title: "Pneumatic & hydraulic", count: "Valves · Fittings · Cylinders" },
        ]
      : locale === "es"
        ? [
            { img: catScreening, title: "Cribado y transportadores", count: "Bandas · Rodillos · Tambores" },
            { img: catMotors, title: "Motores y reductores", count: "Electricos · Industriales" },
            { img: catBearings, title: "Rodamientos y transmisiones", count: "Todas las marcas" },
            { img: catHydraulic, title: "Neumatica e hidraulica", count: "Valvulas · Racores · Cilindros" },
          ]
        : [
            { img: catScreening, title: "Criblage & convoyeurs", count: "Bandes · Rouleaux · Tambours" },
            { img: catMotors, title: "Moteurs & réducteurs", count: "Électriques · Industriels" },
            { img: catBearings, title: "Roulements & transmissions", count: "Toutes marques" },
            { img: catHydraulic, title: "Pneumatique & hydraulique", count: "Vannes · Raccords · Vérins" },
          ];

  const others =
    locale === "en"
      ? [
          "Electrical equipment",
          "Vibration & lifting",
          "Lubrication & sealing",
          "Mechanical transmission",
          "Industrial tooling",
          "Mining wear parts",
          "Filtration & maintenance",
          "Technical products on request",
        ]
      : locale === "es"
        ? [
            "Material electrico",
            "Vibracion y elevacion",
            "Lubricacion y estanqueidad",
            "Transmision mecanica",
            "Herramientas industriales",
            "Piezas de desgaste para canteras",
            "Filtracion y mantenimiento",
            "Productos tecnicos bajo demanda",
          ]
        : [
            "Matériel électrique",
            "Vibration & levage",
            "Graissage & étanchéité",
            "Transmission mécanique",
            "Outillage industriel",
            "Pièces d'usure carrières",
            "Filtration & maintenance",
            "Produits techniques sur demande",
          ];

  const t =
    locale === "en"
      ? {
          eyebrow: "Industrial division · B2B catalogue",
          titleA: "Technical",
          titleB: "products",
          titleC: "for every industrial chain.",
          cta: "View catalogue",
          ctaPdf: "Download PDF catalogue",
          families: "Other categories",
          belowTitle: "Product families in the catalogue",
        }
      : locale === "es"
        ? {
            eyebrow: "Division industrial · Catalogo B2B",
            titleA: "Productos",
            titleB: "tecnicos",
            titleC: "para cada cadena industrial.",
            cta: "Ver catalogo",
            ctaPdf: "Descargar catalogo PDF",
            families: "Otras familias",
            belowTitle: "Familias de productos del catalogo",
          }
        : {
            eyebrow: "Pôle industriel · Catalogue B2B",
            titleA: "Des produits",
            titleB: "techniques",
            titleC: "pour chaque chaîne industrielle.",
            cta: "Voir le catalogue",
            ctaPdf: "Télécharger le catalogue PDF",
            families: "Autres familles",
            belowTitle: "Familles de produits du catalogue",
          };

  const showHero = variant === "section";

  return (
    <section
      id="catalogue"
      className={`bg-[var(--ivory)] overflow-hidden ${showHero ? "py-32 lg:py-40" : "py-16 lg:py-24 border-t border-[var(--navy)]/10"}`}
    >
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          {showHero ? (
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-8">
                <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
                <h2 className="mt-6 display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--navy)]">
                  {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
                </h2>
              </div>
              <div className="lg:col-span-4 flex flex-col items-stretch gap-3 lg:items-end">
                <Button variant="navy" size="lg" asChild>
                  <Link href={`${prefix}/catalogue`}>
                    {t.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="border-[var(--navy)]">
                  <a href={pdfHref} download={CATALOG_PDF_FILENAME}>
                    <Download className="h-4 w-4" />
                    {t.ctaPdf}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <h2 className="mb-10 display-xl text-2xl lg:text-3xl text-[var(--navy)]">{t.belowTitle}</h2>
          )}

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:gap-0 lg:border lg:border-border">
            {featured.map((c, i) => (
              <Link
                key={c.title}
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative shrink-0 w-[78vw] sm:w-[45vw] lg:w-auto snap-center aspect-[2/3] overflow-hidden bg-[var(--navy)] ${
                  i < featured.length - 1 ? "lg:border-r border-border" : ""
                }`}
              >
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  sizes="(max-width: 1024px) 80vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.2) 0%, oklch(0.165 0.045 263 / 0.95) 100%)",
                  }}
                />
                <div className="absolute bottom-0 inset-x-0 p-6 lg:p-8">
                  <div className="eyebrow text-[var(--gold)] mb-3">{c.count}</div>
                  <h3 className="font-display text-2xl lg:text-3xl text-[var(--ivory)] leading-none">{c.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-16 grid lg:grid-cols-12 gap-8 border-t border-[var(--navy)]/10 pt-10">
            <div className="lg:col-span-3">
              <span className="eyebrow text-[var(--navy)]/60">{t.families}</span>
            </div>
            <ul className="lg:col-span-9 grid sm:grid-cols-2 gap-x-8">
              {others.map((o) => (
                <li key={o} className="py-3 border-b border-[var(--navy)]/10 text-[var(--navy)] font-medium">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
