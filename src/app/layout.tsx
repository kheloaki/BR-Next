import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import "./globals.css";
import { PageLayout } from "@/components/site/PageLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/site-config";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BARANE INVEST — Groupe industriel marocain",
    template: "%s · BARANE INVEST",
  },
  description:
    "BARANE INVEST : partenaire B2B pour la construction, l'infrastructure, la logistique, l'équipement industriel et le support mines & carrières au Maroc et en Afrique.",
  openGraph: {
    type: "website",
    locale: "fr_MA",
    siteName: "BARANE INVEST",
    title: "BARANE INVEST — Groupe industriel marocain",
    description:
      "Construction, infrastructure, équipement industriel, mines & carrières.",
  },
  twitter: {
    card: "summary",
    site: "@baraneinvest",
  },
};

function isLocalePrefixedPath(pathname: string): boolean {
  return /^\/(fr|en|es)(\/|$)/.test(pathname);
}

function isAdminPath(pathname: string): boolean {
  return /^\/((fr|en|es)\/)?admin(\/|$)/.test(pathname);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-barane-pathname") ?? "";
  const showDefaultFrGlobalSchema = !isLocalePrefixedPath(pathname);
  const showWebsiteChrome = !isAdminPath(pathname);

  return (
    <ClerkProvider>
      <html lang="fr">
        <body>
          {showDefaultFrGlobalSchema ? (
            <>
              <JsonLd id="organization-schema" data={buildOrganizationSchema("fr")} />
              <JsonLd id="website-schema" data={buildWebsiteSchema("fr")} />
            </>
          ) : null}
          {showWebsiteChrome ? <PageLayout>{children}</PageLayout> : children}
        </body>
      </html>
    </ClerkProvider>
  );
}
