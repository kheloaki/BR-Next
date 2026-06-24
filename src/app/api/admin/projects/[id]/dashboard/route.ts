import { NextResponse } from "next/server";
import { canViewReports } from "@/lib/admin/organization";
import { fetchProjectDashboard } from "@/lib/admin/project-dashboard";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const supabase = getSupabaseAdminClient();

  try {
    const dashboard = await fetchProjectDashboard(supabase, auth.organizationId, projectId);
    if (!dashboard) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    return NextResponse.json(dashboard);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chargement fiche impossible" },
      { status: 500 },
    );
  }
}
