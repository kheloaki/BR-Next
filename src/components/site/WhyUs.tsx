import type { Locale } from "@/lib/i18n";

export function WhyUs({ locale = "fr" }: { locale?: Locale }) {
  const reasons =
    locale === "en"
      ? [
          { title: "Trusted partner", desc: "A B2B relationship built on rigor, transparency and long-term value." },
          { title: "Multi-sector capability", desc: "Construction, equipment, logistics, mining: one partner." },
          { title: "Flexible sourcing", desc: "Local and international supplier network, quickly mobilized." },
          { title: "Local execution", desc: "On-the-ground presence in Morocco with African reach." },
          { title: "Professional structure", desc: "Governance, compliance and solid commitment management." },
          { title: "Operational responsiveness", desc: "Fast responses, structured quotes, rigorous follow-up." },
        ]
      : locale === "es"
        ? [
            { title: "Socio de confianza", desc: "Relacion B2B basada en rigor, transparencia y continuidad." },
            { title: "Capacidad multisectorial", desc: "Construccion, equipamiento, logistica y mineria con un solo interlocutor." },
            { title: "Sourcing flexible", desc: "Red de proveedores locales e internacionales activable con rapidez." },
            { title: "Ejecucion local", desc: "Presencia operativa en Marruecos con apertura en Africa." },
            { title: "Estructura profesional", desc: "Gobernanza, cumplimiento y gestion seria de compromisos." },
            { title: "Reactividad operativa", desc: "Respuestas rapidas, cotizaciones estructuradas y seguimiento riguroso." },
          ]
      : [
          { title: "Partenaire de confiance", desc: "Une relation B2B fondée sur la rigueur, la transparence et la durée." },
          { title: "Capacité multi-sectorielle", desc: "Construction, équipement, logistique, mines : un seul interlocuteur." },
          { title: "Sourcing flexible", desc: "Réseau de fournisseurs locaux et internationaux activable rapidement." },
          { title: "Exécution locale", desc: "Présence terrain au Maroc avec ouverture sur l'Afrique." },
          { title: "Structure professionnelle", desc: "Gouvernance, conformité et gestion sérieuse des engagements." },
          { title: "Réactivité opérationnelle", desc: "Réponses rapides, devis structurés, suivi rigoureux." },
        ];
  const t =
    locale === "en"
      ? { eyebrow: "Why BARANE INVEST", titleA: "Six reasons to trust us with", titleB: "your projects" }
      : locale === "es"
        ? { eyebrow: "Por que BARANE INVEST", titleA: "Seis razones para confiarnos", titleB: "sus proyectos" }
      : { eyebrow: "Pourquoi BARANE INVEST", titleA: "Six raisons de nous confier", titleB: "vos projets" };

  return (
    <section className="py-32 lg:py-40 bg-[var(--ivory)]">
      <div className="px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-[var(--navy)]">{t.eyebrow}</span>
              </div>
            </div>
            <div className="lg:col-span-9">
              <h2 className="display-xl text-5xl lg:text-7xl xl:text-8xl text-[var(--navy)] max-w-4xl">
                {t.titleA} <span className="text-[var(--gold)]">{t.titleB}</span>.
              </h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 border-t border-[var(--navy)]/15">
            {reasons.map((r, i) => (
              <div
                key={r.title}
                className={`p-10 border-b border-[var(--navy)]/15 ${
                  (i + 1) % 3 !== 0 ? "lg:border-r" : ""
                } group hover:bg-[var(--navy-deep)] hover:text-[var(--ivory)] transition-colors duration-500`}
              >
                <div className="flex items-baseline justify-between mb-12">
                  <span className="h-px w-10 bg-[var(--gold)]" />
                </div>
                <h3 className="font-display text-2xl lg:text-3xl text-[var(--navy)] group-hover:text-[var(--ivory)] transition-colors mb-4 leading-none">
                  {r.title}
                </h3>
                <p className="text-sm text-[var(--graphite)] group-hover:text-[var(--ivory)]/65 transition-colors leading-relaxed">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
