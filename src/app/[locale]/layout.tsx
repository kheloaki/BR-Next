import { JsonLd } from "@/components/seo/JsonLd";
import { buildOrganizationSchema, buildWebsiteSchema } from "@/lib/schema";
import { isSupportedLocale, type Locale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return children;
  }
  const l = locale as Locale;
  return (
    <>
      <JsonLd id="organization-schema" data={buildOrganizationSchema(l)} />
      <JsonLd id="website-schema" data={buildWebsiteSchema(l)} />
      {children}
    </>
  );
}
