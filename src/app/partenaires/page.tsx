import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { Partners } from "@/components/site/Partners";
import { Projects } from "@/components/site/Projects";
import { WhyUs } from "@/components/site/WhyUs";
import { ContactCTA } from "@/components/site/ContactCTA";
import { breadcrumbHomeLabel, buildBreadcrumbSchema } from "@/lib/schema";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Partenaires",
  description:
    "Partenaires et écosystème BARANE INVEST pour projets B2B industriels, logistiques et infrastructure au Maroc et en Afrique.",
};

export default function PartenairesPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const bcCurrent =
    locale === "en" ? "Partners" : locale === "es" ? "Socios" : "Partenaires";
  return (
    <div className="pt-20 lg:pt-24">
      <JsonLd
        id="breadcrumb-partenaires"
        data={buildBreadcrumbSchema(
          [
            { name: breadcrumbHomeLabel(locale), path: "/" },
            { name: bcCurrent, path: "/partenaires" },
          ],
          { pathPrefix },
        )}
      />
      <Partners locale={locale} />
      <Projects locale={locale} />
      <WhyUs locale={locale} />
      <ContactCTA locale={locale} />
    </div>
  );
}
