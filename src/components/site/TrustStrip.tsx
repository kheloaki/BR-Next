import type { Locale } from "@/lib/i18n";

export function TrustStrip({ locale = "fr" }: { locale?: Locale }) {
  const items =
    locale === "en"
      ? [
          { v: "SaaS", l: "Business platforms" },
          { v: "Cloud", l: "Hosting & infrastructure" },
          { v: "Web·App", l: "Web & mobile development" },
          { v: "IA", l: "Automation & data" },
          { v: "08+", l: "Industrial sectors" },
          { v: "100+", l: "Product references" },
          { v: "MA · DZ · SN", l: "Operating zone" },
          { v: "24/7", l: "B2B responsiveness" },
        ]
      : locale === "es"
        ? [
            { v: "SaaS", l: "Plataformas de gestion" },
            { v: "Cloud", l: "Alojamiento e infraestructura" },
            { v: "Web·App", l: "Desarrollo web y movil" },
            { v: "IA", l: "Automatizacion y datos" },
            { v: "08+", l: "Sectores industriales" },
            { v: "100+", l: "Referencias de productos" },
            { v: "MA · DZ · SN", l: "Zona operativa" },
            { v: "24/7", l: "Reactividad B2B" },
          ]
        : [
            { v: "SaaS", l: "Plateformes métiers" },
            { v: "Cloud", l: "Hébergement & infra" },
            { v: "Web·App", l: "Développement web & mobile" },
            { v: "IA", l: "Automatisation & data" },
            { v: "08+", l: "Secteurs industriels" },
            { v: "100+", l: "Références produits" },
            { v: "MA · DZ · SN", l: "Zone d'opération" },
            { v: "24/7", l: "Réactivité B2B" },
          ];

  return (
    <section className="border-y border-[var(--gold)]/30 bg-[var(--navy-deep)] text-[var(--ivory)] relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <div
            key={s.l}
            className={`p-6 lg:p-8 ${i < items.length - 1 ? "lg:border-r border-[var(--gold)]/15" : ""} ${i < items.length - 2 ? "border-b lg:border-b-0 border-[var(--gold)]/15" : ""} ${i % 2 === 0 ? "border-r border-[var(--gold)]/15 lg:border-r" : ""}`}
          >
            <div className="font-display text-4xl lg:text-5xl text-[var(--gold)] leading-none">
              {s.v}
            </div>
            <div className="mt-3 eyebrow text-[var(--ivory)]/60">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
