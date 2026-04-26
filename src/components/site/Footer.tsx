"use client";

import { Download, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logoFooter from "@/assets/barane-logo-footer-transparent.png";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const isSpanish = pathname === "/es" || pathname.startsWith("/es/");
  const localePrefix = isEnglish ? "/en" : isSpanish ? "/es" : pathname === "/fr" || pathname.startsWith("/fr/") ? "/fr" : "";
  const localizedHref = (href: string) => (href === "/" ? localePrefix || "/" : `${localePrefix}${href}`);
  const t = isEnglish
    ? {
        description:
          "Moroccan multi-sector company. Construction, infrastructure, logistics, industrial equipment and mining support.",
        company: "Company",
        offer: "Offer",
        about: "About",
        activities: "Activities",
        sectors: "Sectors",
        catalogue: "Catalogue",
        mines: "Mining",
        quote: "Quote",
        contact: "Contact",
        legal: "Legal notice",
        privacy: "Privacy",
        profile: "Company profile",
        city: "Agadir · Morocco",
      }
    : isSpanish
      ? {
          description:
            "Empresa marroqui multisectorial. Construccion, infraestructura, logistica, equipamiento industrial y soporte minero.",
          company: "Empresa",
          offer: "Oferta",
          about: "Nosotros",
          activities: "Actividades",
          sectors: "Sectores",
          catalogue: "Catalogo",
          mines: "Mineria",
          quote: "Cotizacion",
          contact: "Contacto",
          legal: "Aviso legal",
          privacy: "Privacidad",
          profile: "Perfil de empresa",
          city: "Agadir · Marruecos",
        }
    : {
        description:
          "Société marocaine multi-sectorielle. Construction, infrastructure, logistique, équipement industriel et support mines & carrières.",
        company: "Société",
        offer: "Offre",
        about: "À propos",
        activities: "Activités",
        sectors: "Secteurs",
        catalogue: "Catalogue",
        mines: "Mines",
        quote: "Devis",
        contact: "Contact",
        legal: "Mentions légales",
        privacy: "Confidentialité",
        profile: "Profil entreprise",
        city: "Agadir · Maroc",
      };

  return (
    <footer className="bg-[var(--navy-deep)] text-[var(--ivory)]/70 border-t border-[var(--gold)]/15">
      <div className="px-6 lg:px-16 py-20">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center">
              <Image
                src={logoFooter}
                alt="BARANE INVEST"
                width={320}
                height={88}
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="mt-8 text-sm leading-relaxed max-w-sm">
              {t.description}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow text-[var(--gold)] mb-6">{t.company}</h4>
            <ul className="space-y-3 font-display text-xl text-[var(--ivory)]">
              <li>
                <Link href={localizedHref("/about")} className="hover:text-[var(--gold)] transition-colors">
                  {t.about}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/activites")} className="hover:text-[var(--gold)] transition-colors">
                  {t.activities}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/secteurs")} className="hover:text-[var(--gold)] transition-colors">
                  {t.sectors}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="eyebrow text-[var(--gold)] mb-6">{t.offer}</h4>
            <ul className="space-y-3 font-display text-xl text-[var(--ivory)]">
              <li>
                <Link href={localizedHref("/catalogue")} className="hover:text-[var(--gold)] transition-colors">
                  {t.catalogue}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/secteurs/mines-carrieres")} className="hover:text-[var(--gold)] transition-colors">
                  {t.mines}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/contact")} className="hover:text-[var(--gold)] transition-colors">
                  {t.quote}
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="eyebrow text-[var(--gold)] mb-6">{t.contact}</h4>
            <ul className="space-y-3 text-sm">
              <li>{t.city}</li>
              <li>
                <a href="tel:+212661656042" className="hover:text-[var(--gold)]">
                  +212 661 65 60 42
                </a>
              </li>
              <li>
                <a href="mailto:contact@baraneinvest.com" className="hover:text-[var(--gold)]">
                  contact@baraneinvest.com
                </a>
              </li>
            </ul>

            <a
              href="#"
              className="mt-8 inline-flex items-center justify-between gap-4 border border-[var(--gold)]/40 hover:bg-[var(--gold)] hover:text-[var(--navy-deep)] px-5 py-4 transition-all w-full max-w-xs group"
            >
              <span className="eyebrow text-[var(--gold)] group-hover:text-[var(--navy-deep)]">
                {t.profile}
              </span>
              <Download className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--ivory)]/10 px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs eyebrow text-[var(--ivory)]/40">
            © {new Date().getFullYear()} BARANE INVEST
          </p>
          <div className="flex items-center gap-6 text-xs eyebrow text-[var(--ivory)]/40">
            <a href="#" className="hover:text-[var(--gold)]">{t.legal}</a>
            <a href="#" className="hover:text-[var(--gold)]">{t.privacy}</a>
            <a
              href="https://www.linkedin.com/company/baraneinvest"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-[var(--gold)] flex items-center gap-2"
            >
              LinkedIn <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
