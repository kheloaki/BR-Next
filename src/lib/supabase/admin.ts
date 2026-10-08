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

function isTransientFetchError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("socket")
  );
}

async function upsertAdminUserWithRetry(userId: string) {
  const supabase = getSupabaseAdminClient();
  let lastError: { message: string } | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from("admin_users").upsert({ id: userId }, { onConflict: "id" });
    if (!error) return;

    lastError = error;
    if (!isTransientFetchError(error) || attempt === 3) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 250));
  }

  throw new Error(
    lastError?.message
      ? `Supabase admin_users upsert failed: ${lastError.message}`
      : "Supabase admin_users upsert failed",
  );
}

export async function ensureAdminUserRow(userId: string) {
  await upsertAdminUserWithRetry(userId);
  await ensureAdminOrganizationMembership(userId);
}
