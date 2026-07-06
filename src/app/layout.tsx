import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { headers } from "next/headers";
import "./globals.css";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { PageLayout } from "@/components/site/PageLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteUrl } from "@/lib/site-config";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BARANE INVEST — Digital & Industrie au Maroc",
    template: "%s · BARANE INVEST",
  },
  description:
    "BARANE INVEST : startup digitale à Agadir — logiciels métiers, applications web & mobiles, plateformes SaaS, cloud, IA, e-commerce et marketing digital, en complément d'un pôle industriel B2B au Maroc et en Afrique.",
  openGraph: {
    type: "website",
    locale: "fr_MA",
    siteName: "BARANE INVEST",
    title: "BARANE INVEST — Digital & Industrie au Maroc",
    description:
      "Logiciels, SaaS, web & mobile, cloud, IA, e-commerce et marketing digital — et fourniture industrielle B2B.",
  },
  twitter: {
    card: "summary",
    site: "@baraneinvest",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BARANE INVEST",
  },
  icons: {
    apple: "/web-app-manifest-192x192.png",
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
          <PwaInstallPrompt />
          {showWebsiteChrome ? <Analytics /> : null}
        </body>
      </html>
    </ClerkProvider>
  );
}
