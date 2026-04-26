import type { Metadata } from "next";
import { Hero } from "@/components/site/Hero";
import { TrustStrip } from "@/components/site/TrustStrip";
import { About } from "@/components/site/About";
import { Activities } from "@/components/site/Activities";
import { Catalogue } from "@/components/site/Catalogue";
import { Sectors } from "@/components/site/Sectors";
import { WhyUs } from "@/components/site/WhyUs";
import { Partners } from "@/components/site/Partners";
import { Projects } from "@/components/site/Projects";
import { ContactCTA } from "@/components/site/ContactCTA";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title:
    "BARANE INVEST — Groupe industriel marocain · Construction, infrastructure & équipement",
  description:
    "BARANE INVEST : partenaire B2B pour la construction, l'infrastructure, la logistique, l'équipement industriel et le support mines & carrières au Maroc et en Afrique.",
  openGraph: {
    title: "BARANE INVEST — Groupe industriel marocain",
    description:
      "Construction, infrastructure, équipement industriel, mines & carrières.",
  },
};

export default function HomePage({ locale = "fr" }: { locale?: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <TrustStrip locale={locale} />
      <About locale={locale} />
      <Activities locale={locale} />
      <Catalogue locale={locale} />
      <Sectors locale={locale} />
      <WhyUs locale={locale} />
      <Partners locale={locale} />
      <Projects locale={locale} />
      <ContactCTA locale={locale} />
    </>
  );
}
