import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité BARANE INVEST: collecte, finalités, conservation, destinataires et droits sur vos données personnelles.",
  openGraph: {
    title: "Confidentialité | BARANE INVEST",
    description:
      "Politique de confidentialité BARANE INVEST: collecte, finalités, conservation, destinataires et droits sur vos données personnelles.",
  },
  twitter: {
    card: "summary",
    title: "Confidentialité | BARANE INVEST",
    description:
      "Politique de confidentialité BARANE INVEST: collecte, finalités, conservation, destinataires et droits sur vos données personnelles.",
  },
};

export default function PrivacyPage({ locale = "fr" }: { locale?: Locale }) {
  const t =
    locale === "en"
      ? {
          title: "Privacy Policy",
          intro:
            "This policy explains how BARANE INVEST collects, uses and protects personal data through this website.",
          updatedLabel: "Last update",
          updatedAt: "April 2026",
          contactLabel: "Privacy contact",
          contactValue: "contact@baraneinvest.com",
          sections: [
            {
              title: "Data collected",
              content: [
                "When you submit the contact form, we may collect your full name, company, email address, phone number, sector and message details.",
                "Technical connection data (IP, device and browser information) may also be processed for security and debugging purposes.",
              ],
            },
            {
              title: "Purpose of processing",
              content: [
                "Data is used to analyze your request, provide a reply, prepare a quote and ensure operational follow-up for B2B discussions.",
                "Data can also be used to prevent abuse, secure services and maintain traceability of exchanges.",
              ],
            },
            {
              title: "Legal basis",
              content: [
                "Processing is based on your request for contact and on BARANE INVEST legitimate interest in handling business opportunities and requests.",
                "Where applicable, processing can also rely on legal obligations.",
              ],
            },
            {
              title: "Retention period",
              content: [
                "Data is retained only for the duration required to manage your request and any legal or contractual obligations.",
                "When no longer needed, data is deleted or anonymized according to applicable rules.",
              ],
            },
            {
              title: "Recipients and transfers",
              content: [
                "Data is primarily accessible to authorized BARANE INVEST personnel.",
                "Some technical providers (for hosting, email delivery and infrastructure) may process limited data as processors.",
                "BARANE INVEST does not sell personal data.",
              ],
            },
            {
              title: "Your rights",
              content: [
                "You may request access, correction, deletion or restriction of processing of your personal data.",
                "You may also object to specific processing where applicable.",
                "To exercise your rights, contact contact@baraneinvest.com.",
              ],
            },
            {
              title: "Cookies and technical tracking",
              content: [
                "This website may use technical cookies strictly required for operation and security.",
                "If audience measurement tools are introduced, this policy will be updated accordingly.",
              ],
            },
          ],
        }
      : locale === "es"
        ? {
            title: "Politica de privacidad",
            intro:
              "Esta politica explica como BARANE INVEST recopila, utiliza y protege los datos personales a traves de este sitio web.",
            updatedLabel: "Ultima actualizacion",
            updatedAt: "Abril 2026",
            contactLabel: "Contacto de privacidad",
            contactValue: "contact@baraneinvest.com",
            sections: [
              {
                title: "Datos recopilados",
                content: [
                  "Cuando envia el formulario de contacto, podemos recopilar su nombre completo, empresa, correo electronico, telefono, sector y detalle de su necesidad.",
                  "Tambien pueden tratarse datos tecnicos de conexion (IP, dispositivo y navegador) con fines de seguridad y depuracion.",
                ],
              },
              {
                title: "Finalidad del tratamiento",
                content: [
                  "Los datos se usan para analizar su solicitud, responderle, preparar una cotizacion y asegurar el seguimiento operativo de los intercambios B2B.",
                  "Tambien pueden utilizarse para prevenir abusos, proteger los servicios y garantizar trazabilidad de los intercambios.",
                ],
              },
              {
                title: "Base legal",
                content: [
                  "El tratamiento se basa en su solicitud de contacto y en el interes legitimo de BARANE INVEST para gestionar oportunidades y solicitudes comerciales.",
                  "Cuando corresponda, el tratamiento tambien puede basarse en obligaciones legales.",
                ],
              },
              {
                title: "Periodo de conservacion",
                content: [
                  "Los datos se conservan solo durante el tiempo necesario para gestionar su solicitud y cumplir obligaciones legales o contractuales.",
                  "Cuando ya no son necesarios, los datos se eliminan o anonimizan segun las normas aplicables.",
                ],
              },
              {
                title: "Destinatarios y transferencias",
                content: [
                  "Los datos son accesibles principalmente para personal autorizado de BARANE INVEST.",
                  "Algunos proveedores tecnicos (alojamiento, envio de correos e infraestructura) pueden tratar datos limitados como encargados.",
                  "BARANE INVEST no vende datos personales.",
                ],
              },
              {
                title: "Sus derechos",
                content: [
                  "Puede solicitar acceso, rectificacion, supresion o limitacion del tratamiento de sus datos personales.",
                  "Tambien puede oponerse a ciertos tratamientos cuando proceda.",
                  "Para ejercer estos derechos, escriba a contact@baraneinvest.com.",
                ],
              },
              {
                title: "Cookies y seguimiento tecnico",
                content: [
                  "El sitio puede usar cookies tecnicas estrictamente necesarias para su funcionamiento y seguridad.",
                  "Si se incorporan herramientas de medicion de audiencia, esta politica se actualizara en consecuencia.",
                ],
              },
            ],
          }
        : {
            title: "Politique de confidentialité",
            intro:
              "Cette politique explique comment BARANE INVEST collecte, utilise et protège les données personnelles via ce site web.",
            updatedLabel: "Dernière mise à jour",
            updatedAt: "Avril 2026",
            contactLabel: "Contact confidentialité",
            contactValue: "contact@baraneinvest.com",
            sections: [
              {
                title: "Données collectées",
                content: [
                  "Lors de l'envoi du formulaire de contact, nous pouvons collecter votre nom complet, société, e-mail, téléphone, secteur et le détail de votre besoin.",
                  "Des données techniques de connexion (IP, appareil, navigateur) peuvent aussi être traitées à des fins de sécurité et de diagnostic.",
                ],
              },
              {
                title: "Finalité du traitement",
                content: [
                  "Ces données servent à analyser votre demande, vous répondre, préparer une proposition commerciale et assurer le suivi opérationnel des échanges B2B.",
                  "Elles peuvent aussi être utilisées pour prévenir les abus, sécuriser les services et conserver une traçabilité des échanges.",
                ],
              },
              {
                title: "Base légale",
                content: [
                  "Le traitement repose sur votre démarche de contact et sur l'intérêt légitime de BARANE INVEST à traiter les demandes et opportunités commerciales.",
                  "Selon les cas, certains traitements peuvent également répondre à des obligations légales.",
                ],
              },
              {
                title: "Durée de conservation",
                content: [
                  "Les données sont conservées uniquement pendant la durée nécessaire au traitement de votre demande et au respect des obligations légales ou contractuelles.",
                  "Au-delà, elles sont supprimées ou anonymisées selon les règles applicables.",
                ],
              },
              {
                title: "Destinataires et transferts",
                content: [
                  "Les données sont principalement accessibles aux personnes habilitées chez BARANE INVEST.",
                  "Des prestataires techniques (hébergement, envoi d'e-mails, infrastructure) peuvent traiter des données limitées en qualité de sous-traitants.",
                  "BARANE INVEST ne vend pas de données personnelles.",
                ],
              },
              {
                title: "Vos droits",
                content: [
                  "Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation du traitement de vos données personnelles.",
                  "Vous pouvez également vous opposer à certains traitements lorsque cela est applicable.",
                  "Pour exercer ces droits, contactez contact@baraneinvest.com.",
                ],
              },
              {
                title: "Cookies et traceurs techniques",
                content: [
                  "Le site peut utiliser des cookies techniques strictement nécessaires à son fonctionnement et à sa sécurité.",
                  "En cas d'ajout d'outils de mesure d'audience, cette politique sera mise à jour en conséquence.",
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
        <div className="mt-6 border border-[var(--gold)]/25 bg-white p-6">
          <p className="text-sm text-[var(--graphite)]">
            <span className="font-semibold text-[var(--navy)]">{t.updatedLabel}:</span>{" "}
            {t.updatedAt}
          </p>
          <p className="mt-2 text-sm text-[var(--graphite)]">
            <span className="font-semibold text-[var(--navy)]">{t.contactLabel}:</span>{" "}
            <a href={`mailto:${t.contactValue}`} className="hover:text-[var(--gold)] underline underline-offset-2">
              {t.contactValue}
            </a>
          </p>
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
