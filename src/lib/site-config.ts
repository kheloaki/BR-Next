const DEFAULT_SITE_URL = "https://www.baraneinvest.com";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? DEFAULT_SITE_URL;
