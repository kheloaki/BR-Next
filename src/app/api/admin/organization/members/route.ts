import { NextResponse } from "next/server";
import { canManageMembers } from "@/lib/admin/organization";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapMember(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || null,
    email: row.email as string,
    displayName: row.display_name as string,
    role: row.role as string,
    createdAt: row.created_at as string,
    status: row.user_id ? "active" : "invited",
  };
}

export async function GET() {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_organization_members")
    .select("id, user_id, email, display_name, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => mapMember(row as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId, role } = auth;

  if (!canManageMembers(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await request.json()) as {
    email?: string;
    displayName?: string;
    memberRole?: "admin" | "member";
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
  }

  const memberRole = body.memberRole === "admin" ? "admin" : "member";
  const displayName = body.displayName?.trim() || email;

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("admin_organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Cet utilisateur est déjà membre ou invité." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("admin_organization_members")
    .insert({
      organization_id: organizationId,
      email,
      display_name: displayName,
      role: memberRole,
    })
    .select("id, user_id, email, display_name, role, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapMember(data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId, role } = auth;

  if (!canManageMembers(role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: target } = await supabase
    .from("admin_organization_members")
    .select("id, user_id, role")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  if (target.user_id === userId) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous retirer vous-même." }, { status: 400 });
  }
  if (target.role === "owner" && role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut retirer un propriétaire." }, { status: 403 });
  }

  const { error } = await supabase
    .from("admin_organization_members")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
