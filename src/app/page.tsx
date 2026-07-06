import type { Metadata } from "next";
import { Hero } from "@/components/site/Hero";
import { Philosophy } from "@/components/site/Philosophy";
import { TrustStrip } from "@/components/site/TrustStrip";
import { DigitalServices } from "@/components/site/DigitalServices";
import { About } from "@/components/site/About";
import { Activities } from "@/components/site/Activities";
import { Catalogue } from "@/components/site/Catalogue";
import { Sectors } from "@/components/site/Sectors";
import { WhyUs } from "@/components/site/WhyUs";
import { Partners } from "@/components/site/Partners";
import { Projects } from "@/components/site/Projects";
import { ContactCTA } from "@/components/site/ContactCTA";
import type { Locale } from "@/lib/i18n";

const HOME_TITLE = "BARANE INVEST | Digital & Industrie au Maroc";
const HOME_DESCRIPTION =
  "BARANE INVEST, startup digitale à Agadir : logiciels métiers, applications web & mobiles, plateformes SaaS, cloud, IA et e-commerce — en complément de son pôle industriel B2B au Maroc et en Afrique.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default function HomePage({ locale = "fr" }: { locale?: Locale }) {
  return (
    <>
      <Hero locale={locale} />
      <DigitalServices locale={locale} />
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
