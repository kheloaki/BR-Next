import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { organizationMembersCsv } from "@/lib/admin/referential-csv-export";
import {
  ASSIGNABLE_MEMBER_ROLES,
  canManageMembers,
  isAssignableMemberRole,
} from "@/lib/admin/organization";
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

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_organization_members")
    .select("id, user_id, email, display_name, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((row) => mapMember(row as Record<string, unknown>));
  const exportFormat = new URL(request.url).searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return organizationMembersCsv(rows, parseExportFormat(exportFormat));
  }
  return NextResponse.json(rows);
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
    memberRole?: "admin" | "member" | "financier" | "accountant" | "project_manager";
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail invalide" }, { status: 400 });
  }

  const allowedRoles = [...ASSIGNABLE_MEMBER_ROLES];
  const memberRole = allowedRoles.includes(body.memberRole as (typeof allowedRoles)[number])
    ? (body.memberRole as (typeof allowedRoles)[number])
    : "member";
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

export async function PATCH(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId, role: actorRole } = auth;

  if (!canManageMembers(actorRole)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id?: string;
    memberRole?: string;
    displayName?: string;
    transferOwnership?: boolean;
  };
  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { data: target } = await supabase
    .from("admin_organization_members")
    .select("id, user_id, role, email, display_name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const updates: { role?: string; display_name?: string } = {};

  if (body.displayName !== undefined) {
    updates.display_name = body.displayName.trim() || (target.email as string);
  }

  if (body.transferOwnership) {
    if (actorRole !== "owner") {
      return NextResponse.json({ error: "Seul le propriétaire peut transférer la propriété." }, { status: 403 });
    }
    if (target.user_id === userId) {
      return NextResponse.json({ error: "Choisissez un autre membre pour le transfert." }, { status: 400 });
    }
    if (!target.user_id) {
      return NextResponse.json(
        { error: "Le membre doit s'être connecté au moins une fois avant le transfert." },
        { status: 400 },
      );
    }

    const { error: demoteError } = await supabase
      .from("admin_organization_members")
      .update({ role: "admin" })
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (demoteError) return NextResponse.json({ error: demoteError.message }, { status: 500 });

    updates.role = "owner";
  } else if (body.memberRole !== undefined) {
    const nextRole = body.memberRole.trim();
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Utilisez « Transférer la propriété » pour changer le propriétaire." },
        { status: 400 },
      );
    }
    if (target.user_id === userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas modifier votre propre rôle." }, { status: 400 });
    }
    if (!isAssignableMemberRole(nextRole)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    updates.role = nextRole;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("admin_organization_members")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("id, user_id, email, display_name, role, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapMember(data as Record<string, unknown>));
}
