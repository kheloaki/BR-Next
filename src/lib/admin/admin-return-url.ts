export const ADMIN_RETURN_PARAM = "return";

export function withAdminReturnUrl(href: string, returnTo: string) {
  const [path, query = ""] = href.split("?");
  const qs = new URLSearchParams(query);
  qs.set(ADMIN_RETURN_PARAM, returnTo);
  return `${path}?${qs.toString()}`;
}

/** Safe internal admin return target from ?return=… */
export function readAdminReturnUrl(searchParams: { get(name: string): string | null }, fallback: string) {
  const raw = searchParams.get(ADMIN_RETURN_PARAM);
  if (!raw) return fallback;
  if (raw.startsWith("/admin")) return raw;
  return fallback;
}
