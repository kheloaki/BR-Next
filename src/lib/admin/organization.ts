import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type OrganizationRole = "owner" | "admin" | "member";

export type AdminOrganizationContext = {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
};

export function getDefaultOrganizationId() {
  return process.env.ADMIN_ORGANIZATION_ID?.trim() || "barane-invest";
}

export function getDefaultOrganizationName() {
  return process.env.ADMIN_ORGANIZATION_NAME?.trim() || "BARANE INVEST";
}

export async function ensureAdminOrganizationMembership(
  userId: string,
  email?: string | null,
): Promise<AdminOrganizationContext> {
  const supabase = getSupabaseAdminClient();
  const organizationId = getDefaultOrganizationId();
  const organizationName = getDefaultOrganizationName();
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  await supabase.from("admin_organizations").upsert(
    { id: organizationId, name: organizationName },
    { onConflict: "id" },
  );

  const { data: byUser } = await supabase
    .from("admin_organization_members")
    .select("id, role, organization_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser) {
    return { organizationId, organizationName, role: byUser.role as OrganizationRole };
  }

  if (normalizedEmail) {
    const { data: byEmail } = await supabase
      .from("admin_organization_members")
      .select("id, role")
      .eq("organization_id", organizationId)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (byEmail) {
      await supabase
        .from("admin_organization_members")
        .update({ user_id: userId, display_name: normalizedEmail })
        .eq("id", byEmail.id);
      return { organizationId, organizationName, role: byEmail.role as OrganizationRole };
    }
  }

  const { count } = await supabase
    .from("admin_organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const role: OrganizationRole = (count ?? 0) === 0 ? "owner" : "member";

  await supabase.from("admin_organization_members").insert({
    organization_id: organizationId,
    user_id: userId,
    email: normalizedEmail || userId,
    display_name: normalizedEmail || userId,
    role,
  });

  return { organizationId, organizationName, role };
}

export async function resolveAdminOrganizationForUser(userId: string) {
  let email: string | null = null;
  let displayName = "";
  try {
    const user = await currentUser();
    email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null;
    displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  } catch {
    email = null;
  }
  return ensureAdminOrganizationMembership(userId, email ?? displayName);
}

export function canManageMembers(role: OrganizationRole) {
  return role === "owner" || role === "admin";
}
