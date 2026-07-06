import type { Locale } from "@/lib/i18n";

export function WhyUs({ locale = "fr" }: { locale?: Locale }) {
  const kpis =
    locale === "en"
      ? [
          { value: "SaaS", label: "Business platforms", desc: "Centralized sales, clients, documents & data." },
          { value: "Cloud", label: "Hosting & maintenance", desc: "Secure infrastructure, updates and support." },
          { value: "100+", label: "Multi-brand references", desc: "Industrial sourcing across categories." },
          { value: "24h", label: "B2B response time", desc: "Digital projects & industrial quotes." },
        ]
      : locale === "es"
        ? [
            { value: "SaaS", label: "Plataformas de gestion", desc: "Ventas, clientes, documentos y datos centralizados." },
            { value: "Cloud", label: "Alojamiento y mantenimiento", desc: "Infraestructura segura, actualizaciones y soporte." },
            { value: "100+", label: "Referencias multimarca", desc: "Sourcing industrial en todas las categorias." },
            { value: "24h", label: "Respuesta B2B", desc: "Proyectos digitales y cotizaciones industriales." },
          ]
        : [
            { value: "SaaS", label: "Plateformes métiers", desc: "Ventes, clients, documents & données centralisés." },
            { value: "Cloud", label: "Hébergement & maintenance", desc: "Infrastructure sécurisée, mises à jour & support." },
            { value: "100+", label: "Références multi-marques", desc: "Sourcing industriel toutes catégories." },
            { value: "24h", label: "Réactivité B2B", desc: "Projets digitaux & devis industriels." },
          ];

  const t =
    locale === "en"
      ? {
          eyebrow: "Why BARANE INVEST",
          titleA: "Digital",
          titleB: "innovation",
          titleC: "and field execution.",
        }
      : locale === "es"
        ? {
            eyebrow: "Por que BARANE INVEST",
            titleA: "Innovacion",
            titleB: "digital",
            titleC: "y ejecucion en terreno.",
          }
        : {
            eyebrow: "Pourquoi BARANE INVEST",
            titleA: "Innovation",
            titleB: "digitale",
            titleC: "et exécution terrain.",
          };

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
