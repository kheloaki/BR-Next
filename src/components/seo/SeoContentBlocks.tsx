import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type FaqItem = {
  question: string;
  answer: string;
};

type LastUpdatedProps = {
  dateISO: string;
};

export function LastUpdated({ dateISO }: LastUpdatedProps) {
  const formatted = new Date(dateISO).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <p className="text-sm text-[var(--graphite)]/70">
      Derniere mise a jour : <span className="font-medium">{formatted}</span>
    </p>
  );
}

type FaqListProps = {
  title?: string;
  items: FaqItem[];
};

export function FaqList({ title = "Questions frequentes", items }: FaqListProps) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="text-2xl font-semibold text-[var(--navy)]">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.question} className="rounded-md border border-border p-4">
            <h3 className="text-base font-medium text-[var(--navy)]">{item.question}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--graphite)]/85">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

type SeoPageLeadProps = {
  locale?: Locale;
  intro: string;
  faq: FaqItem[];
  updatedISO?: string;
  clusters?: {
    label: string;
    items: Array<{ href: string; text: string }>;
  };
};

export function SeoPageLead({
  locale = "fr",
  intro,
  faq,
  updatedISO = "2026-04-25",
  clusters,
}: SeoPageLeadProps) {
  const labels =
    locale === "en"
      ? { updated: "Last updated", faqTitle: "Frequently asked questions" }
      : locale === "es"
        ? { updated: "Actualizado", faqTitle: "Preguntas frecuentes" }
        : { updated: "Derniere mise a jour", faqTitle: "Questions frequentes" };

  const formatted = new Date(updatedISO).toLocaleDateString(
    locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "fr-FR",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <section className="bg-[var(--navy-deep)] text-[var(--ivory)] py-14 lg:py-16">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-16 border-y border-[var(--gold)]/20">
        <div className="py-6 lg:py-10 border-b border-[var(--gold)]/20">
          <p className="max-w-4xl text-base text-[var(--ivory)]/85 leading-relaxed">{intro}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--ivory)]/65">
            {labels.updated}: <span className="font-semibold text-[var(--gold)]">{formatted}</span>
          </p>
          {clusters ? (
            <p className="mt-4 text-sm text-[var(--ivory)]/80">
              {clusters.label}{" "}
              {clusters.items.map((item, index) => (
                <span key={item.href}>
                  {index > 0 ? " · " : ""}
                  <Link
                    href={item.href}
                    className="underline underline-offset-4 text-[var(--gold-soft)] hover:text-[var(--gold)]"
                  >
                    {item.text}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
        <div className="py-6 lg:py-10">
          <section className="mt-2 border-t border-[var(--gold)]/20 pt-8">
            <h2 className="text-2xl font-semibold text-[var(--ivory)]">{labels.faqTitle}</h2>
            <div className="mt-5 space-y-4">
              {faq.map((item) => (
                <article
                  key={item.question}
                  className="border border-[var(--gold)]/20 bg-[var(--navy)]/55 p-4"
                >
                  <h3 className="text-base font-medium text-[var(--gold-soft)]">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ivory)]/80">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
