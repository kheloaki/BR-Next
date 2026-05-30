import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function nextDaNumber(organizationId: string, kind: "standard" | "gasoil" = "standard") {
  const year = new Date().getFullYear();
  const prefix = kind === "gasoil" ? `DA-GASOIL-${year}-` : `DA-${year}-`;
  const { data } = await getSupabaseAdminClient()
    .from("admin_purchase_requests")
    .select("number")
    .eq("organization_id", organizationId)
    .like("number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data?.[0]?.number) {
    const part = String(data[0].number).slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}
