import type { GasoilContact, GasoilContactRole } from "@/components/admin/operations-types";

export function normalizeProjectIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export function mapGasoilContactRow(r: Record<string, unknown>): GasoilContact {
  return {
    id: r.id as string,
    role: r.role as GasoilContactRole,
    name: r.name as string,
    cin: (r.cin as string) || "",
    jobTitle: (r.job_title as string) || "",
    projectIds: normalizeProjectIds(r.project_ids),
  };
}

export function contactMatchesProject(contact: GasoilContact, projectId: string | null | undefined) {
  if (!projectId?.trim()) return true;
  if (contact.projectIds.length === 0) return true;
  return contact.projectIds.includes(projectId);
}

export function formatGasoilContactLabel(contact: GasoilContact, projectNames?: Map<string, string>) {
  const parts = [contact.name];
  if (contact.cin) parts.push(`CIN ${contact.cin}`);
  if (contact.jobTitle) parts.push(contact.jobTitle);
  if (contact.projectIds.length > 0 && projectNames) {
    const labels = contact.projectIds
      .map((id) => projectNames.get(id))
      .filter(Boolean)
      .slice(0, 2);
    if (labels.length > 0) {
      parts.push(
        contact.projectIds.length > 2
          ? `${labels.join(", ")} +${contact.projectIds.length - 2}`
          : labels.join(", "),
      );
    }
  }
  return parts.join(" · ");
}
