import type { Locale } from "@/lib/i18n";

const industrialPartners = [
  "SKF",
  "FAG",
  "SIEMENS",
  "ABB",
  "PARKER",
  "BOSCH",
  "FENNER",
  "CONTITECH",
  "NSK",
  "TIMKEN",
];

const digitalStack = [
  "NEXT.JS",
  "REACT",
  "TYPESCRIPT",
  "SAAS",
  "CLOUD",
  "AI",
  "POSTGRESQL",
  "VERCEL",
  "AWS",
  "SEO",
];

function MarqueeRow({ items, className }: { items: string[]; className?: string }) {
  const loop = [...items, ...items];
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {loop.map((p, i) => (
          <div
            key={`${p}-${i}`}
            className="flex items-center px-12 lg:px-20 text-[var(--navy)]/40 hover:text-[var(--gold)] transition-colors"
          >
            <span className="font-display text-4xl lg:text-6xl tracking-wider">{p}</span>
            <span className="ml-12 lg:ml-20 text-[var(--gold)]/30">●</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Partners({ locale = "fr" }: { locale?: Locale }) {
  const digitalEyebrow =
    locale === "en"
      ? "Digital stack & expertise"
      : locale === "es"
        ? "Stack digital y experiencia"
        : "Stack digital & expertise";
  const industrialEyebrow =
    locale === "en"
      ? "Industrial brands distributed"
      : locale === "es"
        ? "Marcas industriales distribuidas"
        : "Marques industrielles distribuées";

  return (
    <section className="py-20 bg-[var(--ivory)] border-y border-[var(--navy)]/10 overflow-hidden">
      <div className="px-6 lg:px-16 mb-8">
        <div className="max-w-[1400px] mx-auto">
          <span className="eyebrow text-[var(--navy)]">{digitalEyebrow}</span>
        </div>
      </div>
      <MarqueeRow items={digitalStack} className="mb-16" />

      <div className="px-6 lg:px-16 mb-8">
        <div className="max-w-[1400px] mx-auto">
          <span className="eyebrow text-[var(--navy)]">{industrialEyebrow}</span>
        </div>
      </div>
      <MarqueeRow items={industrialPartners} />
    </section>
  );
}
