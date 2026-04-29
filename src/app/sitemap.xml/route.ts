import { siteUrl } from "@/lib/site-config";
import { buildSitemapIndexXml, sitemapFiles } from "@/lib/sitemap-data";

export const runtime = "nodejs";

export function GET() {
  const xml = buildSitemapIndexXml(sitemapFiles.map((file) => `${siteUrl}${file}`));
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
