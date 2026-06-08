import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TraitementType } from "@/lib/admin/traitement-types";

export function formatTraitementNumber(type: TraitementType, seq: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  const prefix = type === "achat" ? "TR-A" : "TR-V";
  return `${prefix}-${y}-${String(seq).padStart(3, "0")}`;
}

export async function nextTraitementNumber(organizationId: string, type: TraitementType): Promise<string> {
  const y = new Date().getFullYear();
  const prefix = type === "achat" ? `TR-A-${y}-` : `TR-V-${y}-`;
  const { data } = await getSupabaseAdminClient()
    .from("admin_traitements")
    .select("number")
    .eq("organization_id", organizationId)
    .eq("traitement_type", type)
    .like("number", `${prefix}%`)
    .order("number", { ascending: false })
    .limit(1);

  let maxSeq = 0;
  const row = data?.[0]?.number as string | undefined;
  if (row) {
    const m = row.match(/-(\d{3})$/);
    if (m) maxSeq = Number(m[1]) || 0;
  }
  return formatTraitementNumber(type, maxSeq + 1, y);
}
