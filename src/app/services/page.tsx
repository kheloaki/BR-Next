import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Services digitaux",
};

export default function ServicesPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t =
    locale === "en"
      ? {
          eyebrow: "Digital Services",
          title: "Technology, software and growth services for ambitious teams",
          intro:
            "We design, build and operate digital products, IT systems and performance channels with a practical model focused on measurable results.",
          cta: "Discuss your project",
          sectionOffer: "Service Families",
          sectionDeep: "Detailed Capabilities",
          sectionMethod: "Delivery Method",
          sectionImpact: "Expected Impact",
          sectionFaq: "Frequently asked questions",
          cards: [
            {
              title: "Software, web and mobile platforms",
              points: [
                "Development, publishing and operation of software products",
                "Web and mobile applications tailored to business workflows",
                "Digital platforms, marketplaces and SaaS solutions",
              ],
            },
            {
              title: "IT services and digital transformation",
              points: [
                "IT consulting, systems integration and technical architecture",
                "Maintenance, hosting and operational support",
                "Automation, data analysis and process optimization",
              ],
            },
            {
              title: "Digital marketing and e-commerce",
              points: [
                "E-commerce strategy and online channel execution",
                "SEO and digital communication programs",
                "Editorial production and digital content creation",
              ],
            },
          ],
          deepCards: [
            {
              title: "Product engineering and SaaS",
              points: [
                "Product discovery, UX framing and technical scoping",
                "Web platforms, mobile apps and B2B self-service portals",
                "Marketplace architecture, billing flows and SaaS subscriptions",
                "Roadmap execution, release management and lifecycle support",
              ],
            },
            {
              title: "IT operations and transformation",
              points: [
                "IS audits, process diagnosis and modernization plans",
                "System integration between ERP, CRM, finance and operations",
                "Cloud migration, hosting, monitoring and resilience setup",
                "Automation workflows, dashboards and data decision support",
              ],
            },
            {
              title: "Growth, visibility and digital commerce",
              points: [
                "Go-to-market strategy, acquisition funnels and CRO",
                "SEO architecture, technical optimization and content clusters",
                "Editorial planning, brand storytelling and campaign production",
                "E-commerce operations, retention programs and reporting",
              ],
            },
          ],
          process: [
            {
              step: "01",
              title: "Diagnosis and goals",
              desc: "We align business priorities, KPIs, timelines and operational constraints with your teams.",
            },
            {
              step: "02",
              title: "Architecture and roadmap",
              desc: "We define product scope, technical architecture, integration map and phased delivery plan.",
            },
            {
              step: "03",
              title: "Build and launch",
              desc: "We execute design, development, QA and deployment with clear governance and weekly visibility.",
            },
            {
              step: "04",
              title: "Operate and optimize",
              desc: "We monitor outcomes, improve performance and keep systems secure, scalable and business-ready.",
            },
          ],
          impact: [
            "Shorter delivery cycles across digital projects",
            "More reliable operations through better systems integration",
            "Stronger lead generation through structured digital marketing",
            "Better executive decision-making with actionable data",
          ],
          faq: [
            {
              q: "Can you work with an existing in-house team?",
              a: "Yes. We can work as an embedded delivery partner, bringing specialized capabilities while your internal team keeps ownership.",
            },
            {
              q: "Do you support both strategy and execution?",
              a: "Yes. We cover advisory, architecture, implementation and continuous optimization in one delivery framework.",
            },
            {
              q: "Can we start with a limited scope first?",
              a: "Yes. We often start with a focused pilot to validate value quickly before scaling to a wider roadmap.",
            },
          ],
          finalTitle: "Build a digital stack that scales with your business",
          finalText:
            "Tell us your priorities and constraints. We will propose a practical delivery sequence that aligns technology, operations and growth.",
        }
      : locale === "es"
        ? {
            eyebrow: "Servicios digitales",
            title: "Servicios de tecnologia, software y crecimiento para equipos ambiciosos",
            intro:
              "Disenamos, construimos y operamos productos digitales, sistemas IT y canales de rendimiento con un enfoque practico orientado a resultados.",
            cta: "Hablar de su proyecto",
            sectionOffer: "Familias de servicios",
            sectionDeep: "Capacidades detalladas",
            sectionMethod: "Metodo de entrega",
            sectionImpact: "Impacto esperado",
            sectionFaq: "Preguntas frecuentes",
            cards: [
              {
                title: "Software, aplicaciones web y moviles",
                points: [
                  "Desarrollo, edicion y explotacion de productos de software",
                  "Aplicaciones web y moviles adaptadas a procesos de negocio",
                  "Plataformas digitales, marketplaces y soluciones SaaS",
                ],
              },
              {
                title: "Servicios IT y transformacion digital",
                points: [
                  "Consultoria IT, integracion de sistemas y arquitectura tecnica",
                  "Mantenimiento, hosting y soporte operativo",
                  "Automatizacion, analisis de datos y optimizacion de procesos",
                ],
              },
              {
                title: "Marketing digital y e-commerce",
                points: [
                  "Estrategia e-commerce y ejecucion de canales online",
                  "SEO y programas de comunicacion digital",
                  "Produccion editorial y creacion de contenidos digitales",
                ],
              },
            ],
            deepCards: [
              {
                title: "Ingenieria de producto y SaaS",
                points: [
                  "Discovery de producto, encuadre UX y alcance tecnico",
                  "Plataformas web, apps moviles y portales B2B de autoservicio",
                  "Arquitectura de marketplaces, facturacion y suscripciones SaaS",
                  "Ejecucion de roadmap, gestion de releases y soporte evolutivo",
                ],
              },
              {
                title: "Operaciones IT y transformacion",
                points: [
                  "Auditoria de sistemas, diagnostico de procesos y plan de modernizacion",
                  "Integracion entre ERP, CRM, finanzas y operaciones",
                  "Migracion cloud, hosting, monitoreo y resiliencia",
                  "Automatizacion de flujos, dashboards y soporte a decisiones con datos",
                ],
              },
              {
                title: "Crecimiento, visibilidad y comercio digital",
                points: [
                  "Estrategia go-to-market, embudos de adquisicion y CRO",
                  "Arquitectura SEO, optimizacion tecnica y clusters de contenido",
                  "Plan editorial, narrativa de marca y produccion de campanas",
                  "Operacion e-commerce, programas de retencion y reporting",
                ],
              },
            ],
            process: [
              {
                step: "01",
                title: "Diagnostico y objetivos",
                desc: "Alineamos prioridades de negocio, KPIs, plazos y restricciones operativas con sus equipos.",
              },
              {
                step: "02",
                title: "Arquitectura y roadmap",
                desc: "Definimos alcance, arquitectura tecnica, mapa de integracion y plan de entrega por fases.",
              },
              {
                step: "03",
                title: "Construccion y lanzamiento",
                desc: "Ejecutamos diseno, desarrollo, QA y despliegue con gobierno claro y visibilidad semanal.",
              },
              {
                step: "04",
                title: "Operacion y optimizacion",
                desc: "Medimos resultados, mejoramos rendimiento y mantenemos sistemas seguros y escalables.",
              },
            ],
            impact: [
              "Ciclos de entrega mas cortos en proyectos digitales",
              "Operaciones mas fiables gracias a mejor integracion de sistemas",
              "Mayor generacion de oportunidades con marketing estructurado",
              "Decisiones ejecutivas mejor soportadas por datos accionables",
            ],
            faq: [
              {
                q: "Pueden trabajar con un equipo interno ya existente?",
                a: "Si. Podemos integrarnos como partner de entrega especializado mientras su equipo conserva ownership.",
              },
              {
                q: "Cubren estrategia y ejecucion?",
                a: "Si. Cubrimos consultoria, arquitectura, implementacion y optimizacion continua en un mismo marco.",
              },
              {
                q: "Podemos comenzar con un alcance reducido?",
                a: "Si. Normalmente iniciamos con un piloto focalizado para validar valor rapidamente antes de escalar.",
              },
            ],
            finalTitle: "Construya una base digital que escale con su negocio",
            finalText:
              "Comparta sus prioridades y restricciones. Propondremos una secuencia de entrega realista que alinee tecnologia, operaciones y crecimiento.",
          }
        : {
            eyebrow: "Services digitaux",
            title: "Services technologie, logiciels et croissance digitale pour organisations ambitieuses",
            intro:
              "Nous concevons, livrons et operons des produits numeriques, des systemes IT et des leviers de performance avec une approche pragmatique orientee resultats.",
            cta: "Parler de votre projet",
            sectionOffer: "Familles de services",
            sectionDeep: "Capacites detaillees",
            sectionMethod: "Methode d'execution",
            sectionImpact: "Impacts attendus",
            sectionFaq: "Questions frequentes",
            cards: [
              {
                title: "Developpement logiciel, web et mobile",
                points: [
                  "Developpement, edition et exploitation de produits logiciels",
                  "Applications web et mobiles adaptees aux usages metiers",
                  "Plateformes digitales, marketplaces et solutions SaaS",
                ],
              },
              {
                title: "Services informatiques et transformation digitale",
                points: [
                  "Conseil IT, integration de systemes et architecture technique",
                  "Maintenance, hebergement et support operationnel",
                  "Automatisation, analyse de donnees et optimisation des processus",
                ],
              },
              {
                title: "Marketing digital et e-commerce",
                points: [
                  "Strategie e-commerce et activation des canaux numeriques",
                  "Referencement et communication digitale",
                  "Production editoriale et creation de contenus numeriques",
                ],
              },
            ],
            deepCards: [
              {
                title: "Ingenierie produit et SaaS",
                points: [
                  "Discovery produit, cadrage UX et specifications fonctionnelles",
                  "Plateformes web, apps mobiles et portails B2B self-service",
                  "Architecture marketplace, facturation et abonnements SaaS",
                  "Pilotage roadmap, releases et maintenance evolutive",
                ],
              },
              {
                title: "Operations IT et transformation digitale",
                points: [
                  "Audit SI, diagnostic des processus et plan de modernisation",
                  "Integration de systemes entre ERP, CRM, finance et operations",
                  "Migration cloud, hebergement, supervision et resilience",
                  "Automatisation des workflows, dashboards et pilotage data",
                ],
              },
              {
                title: "Croissance digitale, visibilite et e-commerce",
                points: [
                  "Strategie go-to-market, acquisition et optimisation de conversion",
                  "Architecture SEO, optimisation technique et clusters editoriaux",
                  "Planning de contenus, narration de marque et campagnes",
                  "Execution e-commerce, retention client et reporting",
                ],
              },
            ],
            process: [
              {
                step: "01",
                title: "Diagnostic et objectifs",
                desc: "Nous alignons priorites business, KPI, contraintes operationnelles et horizons de livraison.",
              },
              {
                step: "02",
                title: "Architecture et feuille de route",
                desc: "Nous definissons le perimetre, l'architecture, les integrations et un plan de deploiement par phases.",
              },
              {
                step: "03",
                title: "Conception, build et mise en production",
                desc: "Nous deroulons design, developpement, QA et deploiement avec gouvernance claire et suivi hebdomadaire.",
              },
              {
                step: "04",
                title: "Exploitation et optimisation continue",
                desc: "Nous suivons les resultats, ameliorons la performance et securisons la scalabilite des systemes.",
              },
            ],
            impact: [
              "Cycles de livraison plus courts sur les projets digitaux",
              "Operations plus fiables grace a une meilleure integration SI",
              "Pipeline commercial renforce par un marketing digital structure",
              "Meilleure prise de decision via des donnees exploitables",
            ],
            faq: [
              {
                q: "Pouvez-vous travailler avec une equipe interne existante ?",
                a: "Oui. Nous intervenons comme partenaire d'execution integre, en complement des equipes internes.",
              },
              {
                q: "Couvrez-vous strategie et realisation ?",
                a: "Oui. Nous combinons conseil, architecture, implementation et optimisation continue.",
              },
              {
                q: "Peut-on demarrer avec un perimetre reduit ?",
                a: "Oui. Nous pouvons demarrer par un pilote cible pour valider la valeur avant extension.",
              },
            ],
            finalTitle: "Construisez un socle digital qui evolue avec votre activite",
            finalText:
              "Partagez vos priorites et contraintes. Nous proposerons une sequence d'execution realiste qui aligne technologie, operations et croissance.",
          };

  return (
    <section className="relative py-32 lg:py-40 bg-[var(--navy-deep)] text-[var(--ivory)] overflow-hidden">
      <div className="absolute inset-0 bg-topo opacity-[0.06] mix-blend-screen" />
      <div className="relative px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <p className="eyebrow text-[var(--gold)]">{t.eyebrow}</p>
          <h1 className="mt-6 display-xl text-5xl lg:text-7xl xl:text-8xl max-w-5xl">{t.title}</h1>
          <p className="mt-8 max-w-3xl text-[var(--ivory)]/75 leading-relaxed">{t.intro}</p>

          <h2 className="mt-16 eyebrow text-[var(--gold)]">{t.sectionOffer}</h2>
          <div className="mt-6 grid lg:grid-cols-3 border-t border-[var(--gold)]/20">
            {t.cards.map((card, idx) => (
              <article
                key={card.title}
                className={`p-8 lg:p-10 border-b border-[var(--gold)]/20 ${
                  idx < t.cards.length - 1 ? "lg:border-r border-[var(--gold)]/20" : ""
                }`}
              >
                <h3 className="font-display text-2xl lg:text-3xl text-[var(--gold)]">{card.title}</h3>
                <ul className="mt-6 space-y-3 text-[var(--ivory)]/80 text-sm leading-relaxed">
                  {card.points.map((point) => (
                    <li key={point}>- {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionDeep}</h2>
          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            {t.deepCards.map((card) => (
              <article key={card.title} className="border border-[var(--gold)]/25 bg-[var(--navy)]/40 p-8">
                <h3 className="font-display text-3xl text-[var(--ivory)]">{card.title}</h3>
                <ul className="mt-6 space-y-3 text-sm text-[var(--ivory)]/80 leading-relaxed">
                  {card.points.map((point) => (
                    <li key={point}>- {point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionMethod}</h2>
          <div className="mt-6 grid lg:grid-cols-4 border-t border-[var(--gold)]/20">
            {t.process.map((item, idx) => (
              <article
                key={item.step}
                className={`p-6 lg:p-8 border-b border-[var(--gold)]/20 ${
                  idx < t.process.length - 1 ? "lg:border-r border-[var(--gold)]/20" : ""
                }`}
              >
                <p className="eyebrow text-[var(--gold)]">{item.step}</p>
                <h3 className="mt-4 font-display text-2xl text-[var(--ivory)]">{item.title}</h3>
                <p className="mt-4 text-sm text-[var(--ivory)]/75 leading-relaxed">{item.desc}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionImpact}</h2>
          <div className="mt-6 border border-[var(--gold)]/25 bg-[var(--navy)]/40 p-8 lg:p-10">
            <ul className="grid md:grid-cols-2 gap-4 text-[var(--ivory)]/85">
              {t.impact.map((item) => (
                <li key={item} className="text-sm leading-relaxed">
                  - {item}
                </li>
              ))}
            </ul>
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionFaq}</h2>
          <div className="mt-6 space-y-6">
            {t.faq.map((item) => (
              <article key={item.q} className="border-t border-[var(--gold)]/25 pt-5">
                <h3 className="font-display text-2xl text-[var(--ivory)]">{item.q}</h3>
                <p className="mt-3 text-[var(--ivory)]/75 leading-relaxed">{item.a}</p>
              </article>
            ))}
          </div>

          <div className="mt-20 border border-[var(--gold)]/30 bg-[var(--navy)]/45 p-8 lg:p-12">
            <h2 className="font-display text-4xl lg:text-5xl text-[var(--gold)] max-w-4xl">{t.finalTitle}</h2>
            <p className="mt-6 text-[var(--ivory)]/80 max-w-3xl leading-relaxed">{t.finalText}</p>
          </div>

          <div className="mt-10 pb-4">
            <Link
              href={`${pathPrefix}/contact`}
              className="inline-flex items-center border border-[var(--gold)]/40 px-6 py-3 eyebrow text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--navy-deep)] transition-colors"
            >
              {t.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
