import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function nextBonLocationNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `BL-${year}-`;
  const { data } = await getSupabaseAdminClient()
    .from("admin_rental_contracts")
    .select("contract_no")
    .eq("organization_id", organizationId)
    .like("contract_no", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data?.[0]?.contract_no) {
    const part = String(data[0].contract_no).slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function resolveBonLocationNo(organizationId: string, provided?: string) {
  const trimmed = provided?.trim() ?? "";
  if (trimmed) return trimmed;
  return nextBonLocationNumber(organizationId);
}
