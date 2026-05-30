import type { Locale } from "@/lib/i18n";

export function WhyUs({ locale = "fr" }: { locale?: Locale }) {
  const kpis =
    locale === "en"
      ? [
          { value: "24h", label: "B2B response time", desc: "Structured quotes and fast follow-up." },
          { value: "MA·AF", label: "Logistics network", desc: "Morocco base with African reach." },
          { value: "100+", label: "Multi-brand references", desc: "Industrial sourcing across categories." },
          { value: "08+", label: "Business sectors", desc: "Construction, mining, infrastructure, industry." },
        ]
      : locale === "es"
        ? [
            { value: "24h", label: "Respuesta B2B", desc: "Cotizaciones estructuradas y seguimiento rapido." },
            { value: "MA·AF", label: "Red logistica", desc: "Base en Marruecos con alcance en Africa." },
            { value: "100+", label: "Referencias multimarca", desc: "Sourcing industrial en todas las categorias." },
            { value: "08+", label: "Sectores de actividad", desc: "Construccion, mineria, infraestructura, industria." },
          ]
        : [
            { value: "24h", label: "Réactivité B2B", desc: "Devis structurés et suivi rapide." },
            { value: "MA·AF", label: "Réseau logistique", desc: "Base Maroc avec couverture Afrique." },
            { value: "100+", label: "Références multi-marques", desc: "Sourcing industriel toutes catégories." },
            { value: "08+", label: "Secteurs d'activité", desc: "BTP, mines, infrastructure, industrie." },
          ];

  const t =
    locale === "en"
      ? { eyebrow: "Why BARANE INVEST", titleA: "Operational", titleB: "excellence", titleC: "in the field." }
      : locale === "es"
        ? { eyebrow: "Por que BARANE INVEST", titleA: "Excelencia", titleB: "operativa", titleC: "en terreno." }
        : { eyebrow: "Pourquoi BARANE INVEST", titleA: "L'excellence", titleB: "opérationnelle", titleC: "sur le terrain." };

  return (
    <section className="py-32 lg:py-40 bg-[var(--ivory)] border-y border-[var(--navy)]/10">
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-16 max-w-3xl">
            <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
            <h2 className="mt-6 display-xl text-5xl lg:text-7xl text-[var(--navy)]">
              {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span> {t.titleC}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-[var(--navy)]/15">
            {kpis.map((k, i) => (
              <div
                key={k.label}
                className={`p-8 lg:p-10 ${
                  i < kpis.length - 1 ? "border-b sm:border-b-0 sm:border-r border-[var(--navy)]/15" : ""
                } ${i < 2 ? "sm:border-b border-[var(--navy)]/15 lg:border-b-0" : ""}`}
              >
                <div className="font-display text-5xl lg:text-6xl text-[var(--gold)] leading-none">{k.value}</div>
                <div className="mt-4 eyebrow text-[var(--navy)]">{k.label}</div>
                <p className="mt-3 text-sm text-[var(--graphite)] leading-relaxed">{k.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
