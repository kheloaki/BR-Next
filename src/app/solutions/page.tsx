import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import digitalSoftware from "@/assets/digital-software.jpg";
import digitalCloud from "@/assets/digital-cloud.jpg";
import digitalMarketing from "@/assets/digital-marketing.jpg";

export const metadata: Metadata = {
  title: "Solutions & produits digitaux",
  description:
    "Solutions digitales BARANE INVEST: plateformes SaaS, logiciels métiers, applications web et mobiles, marketplaces et e-commerce pour PME marocaines.",
  openGraph: {
    title: "Solutions & produits digitaux | BARANE INVEST",
    description:
      "Plateformes SaaS, logiciels métiers, applications web et mobiles, marketplaces et solutions e-commerce.",
  },
  twitter: {
    card: "summary",
    title: "Solutions & produits digitaux | BARANE INVEST",
    description:
      "Plateformes SaaS, logiciels métiers, applications web et mobiles, marketplaces et solutions e-commerce.",
  },
};

type SolutionCard = {
  title: string;
  desc: string;
  points: string[];
  img: typeof digitalSoftware;
};

function content(locale: Locale) {
  if (locale === "en") {
    return {
      eyebrow: "Solutions & products",
      title: "Digital platforms built to scale with Moroccan businesses",
      intro:
        "We build and operate SaaS platforms, business software, marketplaces and e-commerce solutions — centralizing sales, clients, documents and data in one place, then replicating what works nationally and internationally.",
      cta: "Discuss your solution",
      sectionSolutions: "Solution families",
      sectionCentral: "Centralized platforms",
      centralText:
        "One connected system to manage sales, clients, documents and data — with dashboards, automation and role-based access.",
      centralPoints: [
        "Sales, quotes, orders and invoicing",
        "Client and supplier management (CRM)",
        "Document management and approvals",
        "Data, dashboards and decision support",
      ],
      sectionModel: "Business model",
      modelText:
        "Custom solutions delivered locally, then productized into scalable SaaS offers — sold by subscription and replicable across markets.",
      solutions: [
        {
          title: "SaaS & business software",
          desc: "Scalable SaaS products tailored to SME workflows.",
          points: ["Subscription SaaS platforms", "Custom business software", "Self-service B2B portals"],
          img: digitalSoftware,
        },
        {
          title: "Marketplaces & e-commerce",
          desc: "Online sales channels and multi-vendor platforms.",
          points: ["E-commerce stores", "Multi-vendor marketplaces", "Payment & billing flows"],
          img: digitalMarketing,
        },
        {
          title: "Cloud & data platforms",
          desc: "Hosted, automated and integrated with your systems.",
          points: ["Cloud hosting & maintenance", "Automation & integrations", "Data analysis & dashboards"],
          img: digitalCloud,
        },
      ] as SolutionCard[],
      finalTitle: "Have a platform or product idea?",
      finalText:
        "Share your goals. We propose a practical delivery path — from discovery to launch and scaling.",
    };
  }
  if (locale === "es") {
    return {
      eyebrow: "Soluciones y productos",
      title: "Plataformas digitales creadas para escalar con las empresas marroquies",
      intro:
        "Construimos y operamos plataformas SaaS, software de gestion, marketplaces y soluciones e-commerce, centralizando ventas, clientes, documentos y datos en un solo lugar, y replicando lo que funciona a nivel nacional e internacional.",
      cta: "Hablar de su solucion",
      sectionSolutions: "Familias de soluciones",
      sectionCentral: "Plataformas centralizadas",
      centralText:
        "Un sistema conectado para gestionar ventas, clientes, documentos y datos, con dashboards, automatizacion y accesos por rol.",
      centralPoints: [
        "Ventas, cotizaciones, pedidos y facturacion",
        "Gestion de clientes y proveedores (CRM)",
        "Gestion documental y aprobaciones",
        "Datos, dashboards y soporte a decisiones",
      ],
      sectionModel: "Modelo de negocio",
      modelText:
        "Soluciones a medida entregadas localmente y luego convertidas en ofertas SaaS escalables, vendidas por suscripcion y replicables entre mercados.",
      solutions: [
        {
          title: "SaaS y software de gestion",
          desc: "Productos SaaS escalables adaptados a las PYMES.",
          points: ["Plataformas SaaS por suscripcion", "Software de gestion a medida", "Portales B2B de autoservicio"],
          img: digitalSoftware,
        },
        {
          title: "Marketplaces y e-commerce",
          desc: "Canales de venta online y plataformas multi-vendedor.",
          points: ["Tiendas e-commerce", "Marketplaces multi-vendedor", "Flujos de pago y facturacion"],
          img: digitalMarketing,
        },
        {
          title: "Plataformas cloud y de datos",
          desc: "Alojadas, automatizadas e integradas con sus sistemas.",
          points: ["Hosting cloud y mantenimiento", "Automatizacion e integraciones", "Analisis de datos y dashboards"],
          img: digitalCloud,
        },
      ] as SolutionCard[],
      finalTitle: "Tiene una idea de plataforma o producto?",
      finalText:
        "Comparta sus objetivos. Proponemos un camino de entrega practico, desde el discovery hasta el lanzamiento y la escala.",
    };
  }
  return {
    eyebrow: "Solutions & produits",
    title: "Des plateformes digitales conçues pour évoluer avec les entreprises marocaines",
    intro:
      "Nous concevons et exploitons des plateformes SaaS, logiciels métiers, marketplaces et solutions e-commerce — en centralisant ventes, clients, documents et données au même endroit, puis en répliquant ce qui fonctionne au national et à l'international.",
    cta: "Parler de votre solution",
    sectionSolutions: "Familles de solutions",
    sectionCentral: "Plateformes centralisées",
    centralText:
      "Un système connecté pour gérer ventes, clients, documents et données — avec tableaux de bord, automatisation et accès par rôle.",
    centralPoints: [
      "Ventes, devis, commandes et facturation",
      "Gestion clients et fournisseurs (CRM)",
      "Gestion documentaire et validations",
      "Data, tableaux de bord et aide à la décision",
    ],
    sectionModel: "Modèle économique",
    modelText:
      "Des solutions sur mesure livrées localement, puis transformées en offres SaaS évolutives — commercialisées par abonnement et réplicables sur d'autres marchés.",
    solutions: [
      {
        title: "SaaS & logiciels métiers",
        desc: "Produits SaaS évolutifs adaptés aux usages des PME.",
        points: ["Plateformes SaaS par abonnement", "Logiciels métiers sur mesure", "Portails B2B self-service"],
        img: digitalSoftware,
      },
      {
        title: "Marketplaces & e-commerce",
        desc: "Canaux de vente en ligne et plateformes multi-vendeurs.",
        points: ["Boutiques e-commerce", "Marketplaces multi-vendeurs", "Flux de paiement & facturation"],
        img: digitalMarketing,
      },
      {
        title: "Plateformes cloud & data",
        desc: "Hébergées, automatisées et intégrées à vos systèmes.",
        points: ["Hébergement cloud & maintenance", "Automatisation & intégrations", "Analyse de données & tableaux de bord"],
        img: digitalCloud,
      },
    ] as SolutionCard[],
    finalTitle: "Une idée de plateforme ou de produit ?",
    finalText:
      "Partagez vos objectifs. Nous proposons une trajectoire de livraison concrète — du cadrage au lancement et à la mise à l'échelle.",
  };
}

export default function SolutionsPage({
  locale = "fr",
  pathPrefix = "",
}: {
  locale?: Locale;
  pathPrefix?: string;
}) {
  const t = content(locale);

  return (
    <section className="relative overflow-hidden bg-[var(--navy-deep)] py-32 text-[var(--ivory)] lg:py-40">
      <div className="absolute inset-0 bg-topo opacity-[0.06] mix-blend-screen" />
      <div className="relative px-6 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="eyebrow text-[var(--gold)]">{t.eyebrow}</p>
          <h1 className="mt-6 display-xl max-w-5xl text-5xl lg:text-7xl xl:text-8xl">{t.title}</h1>
          <p className="mt-8 max-w-3xl leading-relaxed text-[var(--ivory)]/75">{t.intro}</p>

          <h2 className="mt-16 eyebrow text-[var(--gold)]">{t.sectionSolutions}</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {t.solutions.map((card) => (
              <article
                key={card.title}
                className="group overflow-hidden border border-[var(--gold)]/25 bg-[var(--navy)]/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, oklch(0.165 0.045 263 / 0.1) 0%, oklch(0.165 0.045 263 / 0.85) 100%)",
                    }}
                  />
                </div>
                <div className="p-8">
                  <h3 className="font-display text-2xl text-[var(--ivory)] lg:text-3xl">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ivory)]/70">{card.desc}</p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--ivory)]/80">
                    {card.points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionCentral}</h2>
          <div className="mt-6 grid gap-6 border border-[var(--gold)]/25 bg-[var(--navy)]/40 p-8 lg:grid-cols-12 lg:p-10">
            <p className="lg:col-span-5 text-[var(--ivory)]/80 leading-relaxed">{t.centralText}</p>
            <ul className="lg:col-span-7 grid gap-3 sm:grid-cols-2 text-sm text-[var(--ivory)]/85">
              {t.centralPoints.map((point) => (
                <li key={point} className="border-l-2 border-[var(--gold)]/40 pl-4 py-1">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <h2 className="mt-20 eyebrow text-[var(--gold)]">{t.sectionModel}</h2>
          <p className="mt-6 max-w-3xl text-[var(--ivory)]/80 leading-relaxed">{t.modelText}</p>

          <div className="mt-20 border border-[var(--gold)]/30 bg-[var(--navy)]/45 p-8 lg:p-12">
            <h2 className="font-display text-4xl text-[var(--gold)] lg:text-5xl max-w-4xl">{t.finalTitle}</h2>
            <p className="mt-6 max-w-3xl text-[var(--ivory)]/80 leading-relaxed">{t.finalText}</p>
            <div className="mt-8">
              <Link
                href={`${pathPrefix}/contact`}
                className="inline-flex items-center border border-[var(--gold)]/40 px-6 py-3 eyebrow text-[var(--gold)] transition-colors hover:bg-[var(--gold)] hover:text-[var(--navy-deep)]"
              >
                {t.cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
