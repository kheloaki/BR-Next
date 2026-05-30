import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function nextExitVoucherNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `BS-${year}-`;
  const { data } = await getSupabaseAdminClient()
    .from("admin_stock_movements")
    .select("exit_voucher_no")
    .eq("organization_id", organizationId)
    .like("exit_voucher_no", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data?.[0]?.exit_voucher_no) {
    const part = String(data[0].exit_voucher_no).slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}
