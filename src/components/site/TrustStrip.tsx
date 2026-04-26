import type { Locale } from "@/lib/i18n";

export function TrustStrip({ locale = "fr" }: { locale?: Locale }) {
  const items =
    locale === "en"
      ? [
          { v: "08+", l: "Business sectors" },
          { v: "100+", l: "Product references" },
          { v: "MA · DZ · SN", l: "Operating zone" },
          { v: "24/7", l: "B2B responsiveness" },
        ]
      : locale === "es"
        ? [
            { v: "08+", l: "Sectores de actividad" },
            { v: "100+", l: "Referencias de productos" },
            { v: "MA · DZ · SN", l: "Zona operativa" },
            { v: "24/7", l: "Reactividad B2B" },
          ]
      : [
          { v: "08+", l: "Secteurs d'activité" },
          { v: "100+", l: "Références produits" },
          { v: "MA · DZ · SN", l: "Zone d'opération" },
          { v: "24/7", l: "Réactivité B2B" },
        ];

  return (
    <section className="border-y border-[var(--gold)]/20 bg-[var(--navy-deep)] text-[var(--ivory)]">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((s, i) => (
          <div
            key={s.l}
            className={`p-8 lg:p-10 ${i < items.length - 1 ? "lg:border-r border-[var(--gold)]/15" : ""} ${i < 2 ? "border-b lg:border-b-0 border-[var(--gold)]/15" : ""} ${i === 0 || i === 2 ? "border-r border-[var(--gold)]/15 lg:border-r" : ""}`}
          >
            <div className="font-display text-5xl lg:text-6xl text-[var(--gold)] leading-none">
              {s.v}
            </div>
            <div className="mt-4 eyebrow text-[var(--ivory)]/60">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
