import type { Locale } from "@/lib/i18n";

const partners = [
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

export function Partners({ locale = "fr" }: { locale?: Locale }) {
  const loop = [...partners, ...partners];
  const eyebrow = locale === "en" ? "Distributed brands & partners" : "Marques & partenaires distribués";

  return (
    <section className="py-20 bg-[var(--ivory)] border-y border-[var(--navy)]/10 overflow-hidden">
      <div className="px-6 lg:px-16 mb-12">
        <div className="max-w-[1400px] mx-auto flex items-center gap-4">
          <span className="eyebrow text-[var(--navy)]">{eyebrow}</span>
        </div>
      </div>

      <div className="relative">
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
    </section>
  );
}
