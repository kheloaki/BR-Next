import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const PREFIX = "SIT-CH-";

function parseSeq(filename: string): number | null {
  const m = /SIT-CH-(\d+)/i.exec(filename);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export async function nextSituationChNumber(organizationId: string): Promise<string> {
  const { data } = await getSupabaseAdminClient()
    .from("admin_report_exports")
    .select("filename")
    .eq("organization_id", organizationId)
    .eq("report_module", "situation_engins");

  let maxSeq = 0;
  for (const row of data ?? []) {
    const seq = parseSeq(String(row.filename ?? ""));
    if (seq !== null) maxSeq = Math.max(maxSeq, seq);
  }
  return `${PREFIX}${String(maxSeq + 1).padStart(3, "0")}`;
}
