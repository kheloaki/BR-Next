/** Preserve unrelated query params; set or clear list/form deep-link keys. */
export function buildAdminListFormHref(
  pathname: string,
  searchParams: { toString(): string },
  opts: { id?: string | null; new?: boolean },
) {
  const qs = new URLSearchParams(searchParams.toString());
  qs.delete("id");
  qs.delete("new");
  if (opts.id) qs.set("id", opts.id);
  else if (opts.new) qs.set("new", "1");
  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function currentAdminPageUrl(pathname: string, searchParams: { toString(): string }) {
  const q = searchParams.toString();
  return q ? `${pathname}?${q}` : pathname;
}
