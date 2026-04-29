import { siteUrl } from "@/lib/site-config";

const locales = ["fr", "en", "es"] as const;

const coreRoutes = [
  "",
  "/about",
  "/activites",
  "/catalogue",
  "/contact",
  "/legal",
  "/partenaires",
  "/privacy",
  "/pourquoi",
  "/projets",
  "/services",
  "/secteurs",
] as const;

const activityRoutes = [
  "/activites/import-export-industriel",
  "/activites/import-export-industriel/conformite-documentaire-import",
  "/activites/logistique-industrielle",
  "/activites/logistique-industrielle/delais-livraison-projets-industriels",
] as const;

const sectorRoutes = [
  "/secteurs/infrastructures",
  "/secteurs/infrastructures/approvisionnement-chantier-multisite",
  "/secteurs/mines-carrieres",
  "/secteurs/mines-carrieres/pieces-usure-criblage",
] as const;

export const sitemapFiles = [
  "/sitemaps/main.xml",
  "/sitemaps/activities.xml",
  "/sitemaps/sectors.xml",
  "/sitemaps/locales.xml",
] as const;

const localeRoutes = coreRoutes.flatMap((route) =>
  locales.map((locale) => `/${locale}${route}`),
);

export const sitemapGroups = {
  main: coreRoutes.map((route) => `${siteUrl}${route}`),
  activities: activityRoutes.map((route) => `${siteUrl}${route}`),
  sectors: sectorRoutes.map((route) => `${siteUrl}${route}`),
  locales: localeRoutes.map((route) => `${siteUrl}${route}`),
} as const;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSitemapIndexXml(urls: readonly string[]) {
  const now = new Date().toISOString();
  const body = urls
    .map(
      (url) => `<sitemap><loc>${escapeXml(url)}</loc><lastmod>${now}</lastmod></sitemap>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export function buildUrlSetXml(urls: readonly string[]) {
  const now = new Date().toISOString();
  const body = urls
    .map((url) => `<url><loc>${escapeXml(url)}</loc><lastmod>${now}</lastmod></url>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}
