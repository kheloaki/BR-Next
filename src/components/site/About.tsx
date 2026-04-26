import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import type { Locale } from "@/lib/i18n";

export function About({ locale = "fr" }: { locale?: Locale }) {
  const t =
    locale === "en"
      ? {
          eyebrow: "About",
          titleA: "A reliable industrial partner,",
          titleB: "structured",
          titleC: "and execution-focused.",
          tag: "Since our origins",
          p1:
            "BARANE INVEST is a Moroccan company specialized in industrial supply, infrastructure works, logistics, and B2B trade.",
          p2:
            "We support contractors, industrial players, mining operators, and public/private principals with corporate rigor and field execution.",
          bullets: [
            "Legally established Moroccan company",
            "Professional governance",
            "Multi-brand sourcing",
            "Nationwide logistics network",
            "Import-export capability",
          ],
          cta: "Our domains",
        }
      : locale === "es"
        ? {
            eyebrow: "Nosotros",
            titleA: "Un socio industrial",
            titleB: "solido",
            titleC: "estructurado y orientado a la ejecucion.",
            tag: "Desde nuestros origenes",
            p1:
              "BARANE INVEST es una empresa marroqui especializada en suministro industrial, infraestructuras, logistica y comercio B2B.",
            p2:
              "Acompanamos a contratistas, industrias, minas y actores publicos/privados con rigor profesional y ejecucion en terreno.",
            bullets: [
              "Empresa marroqui legalmente constituida",
              "Gobernanza profesional",
              "Sourcing multimarca",
              "Red logistica nacional",
              "Capacidad import-export",
            ],
            cta: "Nuestras actividades",
          }
      : {
          eyebrow: "À propos",
          titleA: "Un partenaire industriel",
          titleB: "sérieux",
          titleC: "structuré et opérationnel.",
          tag: "Depuis nos origines",
          p1:
            "BARANE INVEST est une société marocaine spécialisée dans la fourniture industrielle, les travaux d'infrastructure, la logistique et le commerce B2B.",
          p2:
            "Nous accompagnons les contractants, industriels, mines, carrières et donneurs d'ordre publics et privés avec une rigueur corporate et une exécution terrain sans compromis.",
          bullets: [
            "Société marocaine légalement constituée",
            "Gouvernance professionnelle",
            "Approvisionnement multi-marques",
            "Réseau logistique national",
            "Capacité import-export",
          ],
          cta: "Nos domaines",
        };

  return (
    <section id="about" className="relative py-32 lg:py-40 bg-[var(--ivory)] overflow-hidden">
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 sticky top-32">
              <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
            </div>
          </div>

          <div className="lg:col-span-9">
            <h2 className="display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--navy)] max-w-5xl">
              {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span>, {t.titleC}
            </h2>

            <div className="mt-16 grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-6">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={sectorInfrastructure}
                    alt="Infrastructure"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-[var(--gold)] text-[var(--navy-deep)] text-[10px] tracking-[0.3em] font-bold uppercase">
                    {t.tag}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <p className="text-lg lg:text-xl text-[var(--graphite)] leading-relaxed">
                    {t.p1}
                  </p>
                  <p className="mt-6 text-base text-[var(--graphite)]/80 leading-relaxed">
                    {t.p2}
                  </p>
                </div>

                <ul className="mt-12 divide-y divide-[var(--navy)]/10 border-t border-b border-[var(--navy)]/10">
                  {t.bullets.map((p) => (
                    <li key={p} className="py-4 flex items-baseline gap-4">
                      <span className="text-[var(--navy)] font-medium">{p}</span>
                    </li>
                  ))}
                </ul>

                <Button variant="navy" size="lg" className="mt-10 self-start" asChild>
                  <Link href="/activites">
                    {t.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
