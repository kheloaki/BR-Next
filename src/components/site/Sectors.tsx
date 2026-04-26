import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import sectorMining from "@/assets/sector-mining.jpg";
import sectorEquipment from "@/assets/sector-equipment.jpg";
import sectorConstruction from "@/assets/sector-construction.jpg";
import sectorInfrastructure from "@/assets/sector-infrastructure.jpg";
import sectorLogistics from "@/assets/sector-logistics.jpg";
import type { Locale } from "@/lib/i18n";

export function Sectors({ locale = "fr" }: { locale?: Locale }) {
  const sectors =
    locale === "en"
      ? [
          { img: sectorMining, title: "Mining", desc: "Wear parts, screening, heavy maintenance." },
          { img: sectorEquipment, title: "Quarries", desc: "Conveyors, vibration, industrial lifting." },
          { img: sectorConstruction, title: "Construction & industry", desc: "Materials and site equipment." },
          { img: sectorInfrastructure, title: "Infrastructure", desc: "Roads, structures, public projects." },
          { img: sectorLogistics, title: "Logistics", desc: "Coordination, delivery and export flows." },
        ]
      : locale === "es"
        ? [
            { img: sectorMining, title: "Mineria", desc: "Piezas de desgaste, cribado y mantenimiento pesado." },
            { img: sectorEquipment, title: "Canteras", desc: "Transportadores, vibracion y elevacion industrial." },
            { img: sectorConstruction, title: "Construccion e industria", desc: "Materiales y equipos de obra." },
            { img: sectorInfrastructure, title: "Infraestructuras", desc: "Carreteras, obras y proyectos publicos." },
            { img: sectorLogistics, title: "Logistica", desc: "Coordinacion, entrega y flujos de exportacion." },
          ]
      : [
          { img: sectorMining, title: "Mines", desc: "Pièces d'usure, criblage, maintenance lourde." },
          { img: sectorEquipment, title: "Carrières", desc: "Convoyeurs, vibration, levage industriel." },
          { img: sectorConstruction, title: "BTP & industrie", desc: "Matériaux et équipements de chantier." },
          { img: sectorInfrastructure, title: "Infrastructures", desc: "Routes, ouvrages d'art, projets publics." },
          { img: sectorLogistics, title: "Logistique", desc: "Coordination, livraison et flux export." },
        ];
  const t =
    locale === "en"
      ? {
          eyebrow: "Served sectors",
          titleA: "Where",
          titleB: "industry",
          titleC: "moves forward, we operate.",
        }
      : locale === "es"
        ? {
            eyebrow: "Sectores atendidos",
            titleA: "Donde la",
            titleB: "industria",
            titleC: "avanza, intervenimos.",
          }
      : {
          eyebrow: "Secteurs desservis",
          titleA: "Là où",
          titleB: "l'industrie",
          titleC: "avance, nous intervenons.",
        };

  return (
    <section
      id="secteurs"
      className="py-32 lg:py-40 bg-[var(--navy-deep)] text-[var(--ivory)] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-topo opacity-[0.05] mix-blend-screen" />

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

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-0 border-t border-l border-[var(--gold)]/20">
            {sectors.map((s, i) => (
              <article
                key={s.title}
                className={`group relative aspect-[3/4] overflow-hidden cursor-pointer border-r border-b border-[var(--gold)]/20 ${
                  i === 0
                    ? "col-span-2 row-span-2 lg:col-span-2 lg:row-span-1 aspect-[3/4] lg:aspect-auto"
                    : ""
                }`}
              >
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  sizes={i === 0 ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 50vw, 20vw"}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.2) 30%, oklch(0.165 0.045 263 / 0.95) 100%)",
                  }}
                />
                <div className="absolute top-4 right-4 h-10 w-10 bg-[var(--gold)] flex items-center justify-center text-[var(--navy-deep)] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-5 lg:p-6">
                  <h3
                    className={`font-display text-[var(--ivory)] leading-none ${i === 0 ? "text-4xl lg:text-6xl" : "text-2xl lg:text-3xl"}`}
                  >
                    {s.title}
                  </h3>
                  <div className="h-px w-10 bg-[var(--gold)] my-3" />
                  <p className="text-xs lg:text-sm text-[var(--ivory)]/60">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
