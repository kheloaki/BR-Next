import { createClient } from "@supabase/supabase-js";
import { ensureAdminOrganizationMembership } from "@/lib/admin/organization";

function getServerEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseAdminClient() {
  return createClient(
    getServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function ensureAdminUserRow(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("admin_users")
    .upsert({ id: userId }, { onConflict: "id" });
  if (error) {
    throw new Error(error.message);
  }
  await ensureAdminOrganizationMembership(userId);
}
