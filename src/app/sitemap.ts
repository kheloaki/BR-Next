import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

const routes = [
  "",
  "/about",
  "/activites",
  "/activites/import-export-industriel",
  "/activites/import-export-industriel/conformite-documentaire-import",
  "/activites/logistique-industrielle",
  "/activites/logistique-industrielle/delais-livraison-projets-industriels",
  "/catalogue",
  "/contact",
  "/partenaires",
  "/pourquoi",
  "/projets",
  "/secteurs",
  "/secteurs/infrastructures",
  "/secteurs/infrastructures/approvisionnement-chantier-multisite",
  "/secteurs/mines-carrieres",
  "/secteurs/mines-carrieres/pieces-usure-criblage",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route, index) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.7,
    alternates: {
      languages: {
        fr: `${siteUrl}/fr${route}`,
        en: `${siteUrl}/en${route}`,
        es: `${siteUrl}/es${route}`,
        "x-default": `${siteUrl}${route}`,
      },
    },
  }));
}
