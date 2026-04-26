import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import catScreening from "@/assets/cat-screening.jpg";
import catMotors from "@/assets/cat-motors.jpg";
import catBearings from "@/assets/cat-bearings.jpg";
import catHydraulic from "@/assets/cat-hydraulic.jpg";
import type { Locale } from "@/lib/i18n";

export function Catalogue({ locale = "fr" }: { locale?: Locale }) {
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
          eyebrow: "B2B catalogue",
          titleA: "Technical",
          titleB: "products",
          titleC: "for every chain.",
          cta: "Full catalogue",
          families: "Other categories",
        }
      : locale === "es"
        ? {
            eyebrow: "Catalogo B2B",
            titleA: "Productos",
            titleB: "tecnicos",
            titleC: "para cada cadena de valor.",
            cta: "Catalogo completo",
            families: "Otras familias",
          }
      : {
          eyebrow: "Catalogue B2B",
          titleA: "Des produits",
          titleB: "techniques",
          titleC: "pour chaque chaîne.",
          cta: "Catalogue complet",
          families: "Autres familles",
        };

  return (
    <section id="catalogue" className="py-32 lg:py-40 bg-[var(--ivory)]">
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
              </div>
            </div>
            <div className="lg:col-span-6">
              <h2 className="display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--navy)]">
                {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
              </h2>
            </div>
            <div className="lg:col-span-3 flex lg:justify-end items-end">
              <Button variant="navy" size="lg" asChild>
                <Link href="/contact">
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
            {featured.map((c, i) => (
              <div
                key={c.title}
                className={`group relative aspect-[3/4] overflow-hidden bg-[var(--navy)] cursor-pointer ${
                  i < featured.length - 1 ? "lg:border-r border-border" : ""
                }`}
              >
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                  <h3 className="font-display text-2xl lg:text-3xl text-[var(--ivory)] leading-none">
                    {c.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 grid lg:grid-cols-12 gap-8 border-t border-[var(--navy)]/10 pt-10">
            <div className="lg:col-span-3">
              <span className="eyebrow text-[var(--navy)]/60">{t.families}</span>
            </div>
            <ul className="lg:col-span-9 grid sm:grid-cols-2 gap-x-8">
              {others.map((o) => (
                <li
                  key={o}
                  className="flex items-baseline gap-4 py-3 border-b border-[var(--navy)]/10"
                >
                  <span className="text-[var(--navy)] font-medium">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
