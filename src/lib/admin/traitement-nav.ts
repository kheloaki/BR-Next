import type { TraitementType } from "@/lib/admin/traitement-types";

export function traitementsHref(opts?: {
  type?: TraitementType;
  id?: string;
  new?: boolean;
}) {
  const qs = new URLSearchParams();
  if (opts?.type) qs.set("type", opts.type);
  if (opts?.id) qs.set("id", opts.id);
  if (opts?.new) qs.set("new", "1");
  const q = qs.toString();
  return q ? `/admin/traitements?${q}` : "/admin/traitements";
}

export function traitementReturnPath(traitementType: TraitementType, traitementId: string) {
  return traitementsHref({ type: traitementType, id: traitementId });
}
