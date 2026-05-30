import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolves project_id and cached site_name from admin_projects (FK-only, no free-text fallback). */
export async function resolveProjectFields(
  supabase: SupabaseClient,
  organizationId: string,
  projectId?: string | null,
) {
  const id = projectId?.trim();
  if (!id) {
    return { project_id: null, site_name: "" };
  }
  const { data } = await supabase
    .from("admin_projects")
    .select("id, name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (data) {
    return { project_id: data.id as string, site_name: data.name as string };
  }
  return { project_id: null, site_name: "" };
}

export async function resolveDepotFields(
  supabase: SupabaseClient,
  organizationId: string,
  depotId?: string | null,
) {
  const id = depotId?.trim();
  if (!id) return { depot_id: null, depot_name: "" };
  const { data } = await supabase
    .from("admin_depots")
    .select("id, name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return { depot_id: null, depot_name: "" };
  return { depot_id: data.id as string, depot_name: data.name as string };
}
