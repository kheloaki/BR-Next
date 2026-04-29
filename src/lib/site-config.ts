const DEFAULT_SITE_URL = "https://www.baraneinvest.com";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

export const siteUrl = configuredSiteUrl && configuredSiteUrl.length > 0 ? configuredSiteUrl : DEFAULT_SITE_URL;
