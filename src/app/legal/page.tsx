import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Informations légales de BARANE INVEST: éditeur, hébergement, propriété intellectuelle, responsabilité et droit applicable.",
  openGraph: {
    title: "Mentions légales | BARANE INVEST",
    description:
      "Informations légales de BARANE INVEST: éditeur, hébergement, propriété intellectuelle, responsabilité et droit applicable.",
  },
  twitter: {
    card: "summary",
    title: "Mentions légales | BARANE INVEST",
    description:
      "Informations légales de BARANE INVEST: éditeur, hébergement, propriété intellectuelle, responsabilité et droit applicable.",
  },
};

export default function LegalPage({ locale = "fr" }: { locale?: Locale }) {
  const t =
    locale === "en"
      ? {
          title: "Legal Notice",
          intro:
            "This page sets out the legal framework applicable to the BARANE INVEST website and to the consultation of its content.",
          updatedLabel: "Last update",
          updatedAt: "April 2026",
          keyFactsTitle: "Key information",
          keyFacts: [
            "Website owner: BARANE INVEST",
            "Location: Agadir, Morocco",
            "Contact: contact@baraneinvest.com",
            "Hosting provider: Vercel Inc.",
          ],
          sections: [
            {
              title: "Publisher",
              content: [
                "The website is published by BARANE INVEST.",
                "For legal, commercial or regulatory requests, you can use the contact form or write to contact@baraneinvest.com.",
                "The publication manager is designated internally by BARANE INVEST.",
              ],
            },
            {
              title: "Hosting",
              content: [
                "This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.",
                "Hosting services include website distribution, security and technical availability.",
              ],
            },
            {
              title: "Intellectual Property",
              content: [
                "All texts, visuals, trademarks, logos, graphics and other elements published on this site are protected by intellectual property law.",
                "Any reproduction, distribution, modification, extraction or reuse, in whole or in part, without prior written authorization is prohibited.",
              ],
            },
            {
              title: "Liability",
              content: [
                "BARANE INVEST makes reasonable efforts to keep content reliable and up to date.",
                "However, the company cannot guarantee that all information is complete, exact or continuously available.",
                "Users remain responsible for verifying the suitability of information before making operational or commercial decisions.",
              ],
            },
            {
              title: "External links",
              content: [
                "The website may contain links to third-party websites for information purposes.",
                "BARANE INVEST has no control over these external websites and cannot be held responsible for their content, availability or policies.",
              ],
            },
            {
              title: "Applicable law and jurisdiction",
              content: [
                "These legal notices are governed by applicable Moroccan law.",
                "In the absence of an amicable resolution, any dispute may be brought before competent courts.",
              ],
            },
          ],
        }
      : locale === "es"
        ? {
            title: "Aviso legal",
            intro:
              "Esta pagina define el marco legal aplicable al sitio web de BARANE INVEST y a la consulta de su contenido.",
            updatedLabel: "Ultima actualizacion",
            updatedAt: "Abril 2026",
            keyFactsTitle: "Informacion clave",
            keyFacts: [
              "Titular del sitio: BARANE INVEST",
              "Ubicacion: Agadir, Marruecos",
              "Contacto: contact@baraneinvest.com",
              "Alojamiento: Vercel Inc.",
            ],
            sections: [
              {
                title: "Editor",
                content: [
                  "El sitio web es publicado por BARANE INVEST.",
                  "Para solicitudes legales, comerciales o regulatorias, puede usar el formulario de contacto o escribir a contact@baraneinvest.com.",
                  "El responsable de publicacion es designado internamente por BARANE INVEST.",
                ],
              },
              {
                title: "Alojamiento",
                content: [
                  "Este sitio web esta alojado por Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.",
                  "El servicio de alojamiento cubre distribucion del sitio, seguridad y disponibilidad tecnica.",
                ],
              },
              {
                title: "Propiedad intelectual",
                content: [
                  "Todos los textos, visuales, marcas, logotipos, graficos y otros elementos publicados en este sitio estan protegidos por la legislacion de propiedad intelectual.",
                  "Se prohibe toda reproduccion, distribucion, modificacion, extraccion o reutilizacion total o parcial sin autorizacion previa por escrito.",
                ],
              },
              {
                title: "Responsabilidad",
                content: [
                  "BARANE INVEST realiza esfuerzos razonables para mantener la informacion fiable y actualizada.",
                  "Sin embargo, no puede garantizar que toda la informacion sea completa, exacta o continuamente disponible.",
                  "El usuario sigue siendo responsable de verificar la pertinencia de la informacion antes de cualquier decision operativa o comercial.",
                ],
              },
              {
                title: "Enlaces externos",
                content: [
                  "El sitio puede incluir enlaces a sitios de terceros con finalidad informativa.",
                  "BARANE INVEST no controla esos sitios y no se responsabiliza por su contenido, disponibilidad o politicas.",
                ],
              },
              {
                title: "Ley aplicable y jurisdiccion",
                content: [
                  "Este aviso legal se rige por la legislacion marroqui aplicable.",
                  "En ausencia de solucion amistosa, cualquier litigio podra presentarse ante la jurisdiccion competente.",
                ],
              },
            ],
          }
        : {
            title: "Mentions légales",
            intro:
              "Cette page définit le cadre légal applicable au site web BARANE INVEST et à la consultation de ses contenus.",
            updatedLabel: "Dernière mise à jour",
            updatedAt: "Avril 2026",
            keyFactsTitle: "Informations clés",
            keyFacts: [
              "Propriétaire du site: BARANE INVEST",
              "Localisation: Agadir, Maroc",
              "Contact: contact@baraneinvest.com",
              "Hébergeur: Vercel Inc.",
            ],
            sections: [
              {
                title: "Éditeur",
                content: [
                  "Le site web est édité par BARANE INVEST.",
                  "Pour toute demande juridique, commerciale ou réglementaire, vous pouvez utiliser le formulaire de contact ou écrire à contact@baraneinvest.com.",
                  "Le directeur de publication est désigné en interne par BARANE INVEST.",
                ],
              },
              {
                title: "Hébergement",
                content: [
                  "Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.",
                  "Le service d'hébergement couvre la diffusion du site, la sécurité et sa disponibilité technique.",
                ],
              },
              {
                title: "Propriété intellectuelle",
                content: [
                  "L'ensemble des textes, visuels, marques, logos, éléments graphiques et contenus publiés sur le site est protégé par le droit de la propriété intellectuelle.",
                  "Toute reproduction, diffusion, modification, extraction ou réutilisation, totale ou partielle, sans autorisation écrite préalable est interdite.",
                ],
              },
              {
                title: "Responsabilité",
                content: [
                  "BARANE INVEST met en oeuvre des efforts raisonnables pour diffuser des informations fiables et actualisées.",
                  "La société ne peut toutefois garantir l'exhaustivité, l'exactitude permanente ou la disponibilité continue de l'ensemble des contenus.",
                  "L'utilisateur reste responsable de vérifier l'adéquation des informations avant toute décision opérationnelle ou commerciale.",
                ],
              },
              {
                title: "Liens externes",
                content: [
                  "Le site peut contenir des liens vers des sites tiers à titre informatif.",
                  "BARANE INVEST n'exerce pas de contrôle sur ces sites externes et ne saurait être responsable de leurs contenus, disponibilités ou politiques.",
                ],
              },
              {
                title: "Droit applicable et juridiction",
                content: [
                  "Les présentes mentions légales sont régies par le droit marocain applicable.",
                  "En cas d'absence de résolution amiable, tout litige pourra être porté devant la juridiction compétente.",
                ],
              },
            ],
          };

  return (
    <section className="bg-[var(--ivory)] text-[var(--navy-deep)]">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-16 py-20 lg:py-28">
        <h1 className="display-xl text-[clamp(2rem,6vw,4.5rem)] leading-[0.9]">
          {t.title}
        </h1>
        <p className="mt-6 text-[var(--graphite)]">{t.intro}</p>
        <p className="mt-4 text-sm text-[var(--graphite)]/80">
          {t.updatedLabel}: {t.updatedAt}
        </p>
        <div className="mt-8 border border-[var(--gold)]/25 bg-white p-6">
          <h2 className="eyebrow text-[var(--gold)]">{t.keyFactsTitle}</h2>
          <ul className="mt-4 space-y-2 text-[var(--graphite)]">
            {t.keyFacts.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="mt-10 space-y-8">
          {t.sections.map((section) => (
            <article key={section.title} className="border-t border-[var(--gold)]/30 pt-6">
              <h2 className="text-[var(--navy)] font-display text-2xl">{section.title}</h2>
              <div className="mt-3 space-y-3 text-[var(--graphite)] leading-relaxed">
                {section.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
