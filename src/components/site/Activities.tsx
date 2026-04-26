import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function Activities({ locale = "fr" }: { locale?: Locale }) {
  const activities =
    locale === "en"
      ? [
          { title: "Construction & materials", desc: "Supply and support for civil and building projects." },
          { title: "Infrastructure works", desc: "Support for road, urban and industrial infrastructure projects." },
          { title: "Logistics & transport", desc: "Logistics coordination and secured delivery to remote sites." },
          { title: "Trade & distribution", desc: "Multi-brand distribution of industrial and technical products." },
          { title: "Import-export", desc: "International sourcing and export flows across Africa." },
          { title: "Public works", desc: "Technical and material support for public works contractors." },
          { title: "Industrial equipment", desc: "Motors, gearboxes, conveyors, transmission and critical parts." },
          { title: "Mining support", desc: "Wear parts, screening, vibration, lifting and maintenance." },
        ]
      : locale === "es"
        ? [
            { title: "Construccion y materiales", desc: "Suministro y soporte para obras de construccion e ingenieria civil." },
            { title: "Infraestructura y desarrollo", desc: "Apoyo a proyectos de infraestructura vial, urbana e industrial." },
            { title: "Logistica y transporte", desc: "Coordinacion logistica y entregas seguras en sitios remotos." },
            { title: "Comercio y distribucion", desc: "Distribucion multimarca de productos industriales y tecnicos." },
            { title: "Import-export", desc: "Sourcing internacional y flujos de exportacion en Africa." },
            { title: "Obras publicas", desc: "Soporte tecnico y material para empresas de obra publica." },
            { title: "Equipamiento industrial", desc: "Motores, reductores, transportadores y piezas criticas." },
            { title: "Soporte minero", desc: "Piezas de desgaste, cribado, vibracion e intervenciones de mantenimiento." },
          ]
      : [
          {
            title: "Construction & matériaux",
            desc: "Fourniture et accompagnement pour chantiers de bâtiment et génie civil.",
          },
          {
            title: "Infrastructures & aménagements",
            desc: "Soutien aux projets d'infrastructure routière, urbaine et industrielle.",
          },
          { title: "Logistique & transport", desc: "Coordination logistique, livraisons sécurisées sur sites distants." },
          { title: "Commerce & distribution", desc: "Distribution multi-marques de produits industriels et techniques." },
          { title: "Import-export", desc: "Sourcing international et flux export vers l'Afrique de l'Ouest et au-delà." },
          { title: "Travaux publics", desc: "Appui technique et matériel pour entreprises de TP et concessionnaires." },
          { title: "Équipement industriel", desc: "Moteurs, réducteurs, convoyeurs, transmissions et pièces critiques." },
          { title: "Support mines & carrières", desc: "Pièces d'usure, criblage, vibration, levage et maintenance industrielle." },
        ];
  const t =
    locale === "en"
      ? {
          eyebrow: "Business domains",
          titleA: "A",
          titleB: "multi-sector",
          titleC: "offer for industrial projects.",
        }
      : locale === "es"
        ? {
            eyebrow: "Areas de actividad",
            titleA: "Una oferta",
            titleB: "multisectorial",
            titleC: "al servicio de proyectos industriales.",
          }
      : {
          eyebrow: "Domaines d'activité",
          titleA: "Une offre",
          titleB: "multi-sectorielle",
          titleC: "au service des projets industriels.",
        };

  return (
    <section
      id="activites"
      className="relative py-32 lg:py-40 bg-[var(--navy-deep)] text-[var(--ivory)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-topo opacity-[0.06] mix-blend-screen" />

      <div className="relative px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-[var(--gold)]">{t.eyebrow}</span>
              </div>
            </div>
            <div className="lg:col-span-9">
              <h2 className="display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--ivory)] max-w-4xl">
                {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
              </h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--gold)]/20">
            {activities.map(({ title, desc }, i) => (
              <div
                key={title}
                className={`group p-8 lg:p-10 border-b border-[var(--gold)]/20 cursor-pointer hover:bg-[var(--navy)] transition-colors duration-500 relative ${
                  (i + 1) % 4 !== 0 ? "lg:border-r border-[var(--gold)]/20" : ""
                } ${(i + 1) % 2 !== 0 ? "sm:border-r border-[var(--gold)]/20 lg:border-r" : ""}`}
              >
                <div className="flex items-start justify-between mb-12">
                  <ArrowUpRight className="h-5 w-5 text-[var(--ivory)]/30 group-hover:text-[var(--gold)] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-500" />
                </div>
                <h3 className="font-display text-2xl lg:text-3xl text-[var(--ivory)] mb-4 group-hover:text-[var(--gold)] transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-[var(--ivory)]/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
