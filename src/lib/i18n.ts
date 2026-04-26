export const supportedLocales = ["fr", "en", "es"] as const;

export type Locale = (typeof supportedLocales)[number];

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}
