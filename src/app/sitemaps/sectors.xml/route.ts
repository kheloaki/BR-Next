import { buildUrlSetXml, sitemapGroups } from "@/lib/sitemap-data";

export const runtime = "nodejs";

export function GET() {
  const xml = buildUrlSetXml(sitemapGroups.sectors);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
