import type { Metadata } from "next";
import { Hero } from "@/components/site/Hero";
import { Philosophy } from "@/components/site/Philosophy";
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
  title: "BARANE INVEST | Groupe industriel marocain B2B",
  description:
    "BARANE INVEST accompagne les entreprises en construction, infrastructure, logistique et équipement industriel avec une exécution terrain orientée résultats au Maroc et en Afrique.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BARANE INVEST | Groupe industriel marocain B2B",
    description:
      "BARANE INVEST accompagne les entreprises en construction, infrastructure, logistique et équipement industriel avec une exécution terrain orientée résultats au Maroc et en Afrique.",
  },
  twitter: {
    card: "summary",
    title: "BARANE INVEST | Groupe industriel marocain B2B",
    description:
      "BARANE INVEST accompagne les entreprises en construction, infrastructure, logistique et équipement industriel avec une exécution terrain orientée résultats au Maroc et en Afrique.",
  },
};

export default function HomePage({ locale = "fr" }: { locale?: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <Philosophy locale={locale} />
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
