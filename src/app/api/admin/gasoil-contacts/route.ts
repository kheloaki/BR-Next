import { NextResponse } from "next/server";
import { mapGasoilContactRow, normalizeProjectIds } from "@/lib/admin/map-gasoil-contact";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import type { GasoilContactRole } from "@/components/admin/operations-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ROLES: GasoilContactRole[] = ["conducteur", "pompiste"];

const CONTACT_SELECT = "id, role, name, cin, job_title, project_ids";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const role = new URL(request.url).searchParams.get("role");

  let query = getSupabaseAdminClient()
    .from("admin_gasoil_contacts")
    .select(CONTACT_SELECT)
    .eq("organization_id", organizationId)
    .order("name");

  if (role && ROLES.includes(role as GasoilContactRole)) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapGasoilContactRow(r as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    role?: GasoilContactRole;
    name?: string;
    cin?: string;
    jobTitle?: string;
    projectIds?: string[];
  };
  const role = body.role;
  const name = body.name?.trim() || "";

  if (!role || !ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide (conducteur ou pompiste)" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const payload = {
    role,
    name,
    cin: role === "conducteur" ? body.cin?.trim() || "" : "",
    job_title: role === "conducteur" ? body.jobTitle?.trim() || "" : "",
    project_ids: role === "conducteur" ? normalizeProjectIds(body.projectIds) : [],
  };

  const result = await getSupabaseAdminClient()
    .from("admin_gasoil_contacts")
    .insert({
      id: opsId("gcontact"),
      user_id: userId,
      organization_id: organizationId,
      ...payload,
    })
    .select(CONTACT_SELECT)
    .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return NextResponse.json({ error: "Ce nom existe déjà pour ce rôle." }, { status: 400 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(mapGasoilContactRow(result.data as Record<string, unknown>));
}
