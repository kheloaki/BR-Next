import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { WhyUs } from "@/components/site/WhyUs";
import { About } from "@/components/site/About";
import { Partners } from "@/components/site/Partners";
import { ContactCTA } from "@/components/site/ContactCTA";
import { breadcrumbHomeLabel, buildBreadcrumbSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Pourquoi nous",
  description:
    "Pourquoi choisir BARANE INVEST: rigueur d'exécution, approche multi-sectorielle et accompagnement B2B orienté résultat.",
};

export default function PourquoiPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const bcCurrent =
    locale === "en" ? "Why us" : locale === "es" ? "Por que nosotros" : "Pourquoi nous";
  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-pourquoi"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: bcCurrent, path: "/pourquoi" },
          ],
          { pathPrefix },
        )}
      />
      <WhyUs locale={locale} />
      <About locale={locale} />
      <Partners locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
