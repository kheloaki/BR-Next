import type { AdminProject, ProjectStatus } from "@/components/admin/operations-types";
import { parseFicheVisibleSections } from "@/lib/admin/project-fiche-sections";

const STATUSES: ProjectStatus[] = ["active", "inactive"];

function mapProjectStatus(raw: string): ProjectStatus {
  if (raw === "active" || raw === "inactive") return raw;
  if (raw === "draft" || raw === "suspended" || raw === "closed") return "inactive";
  return "active";
}

export function mapAdminProjectRow(r: Record<string, unknown>): AdminProject {
  const status = r.status as string;
  return {
    id: r.id as string,
    code: (r.code as string) || "",
    name: r.name as string,
    clientName: (r.client_name as string) || "",
    status: mapProjectStatus(status),
    startDate: (r.start_date as string) || null,
    endDate: (r.end_date as string) || null,
    location: (r.location as string) || "",
    address: (r.address as string) || "",
    managerName: (r.manager_name as string) || "",
    marketNumber: (r.market_number as string) || "",
    marketDescription: (r.market_description as string) || "",
    chantierDocumentUrl: (r.chantier_document_url as string) || "",
    planUrl: (r.plan_url as string) || "",
    notes: (r.notes as string) || "",
    budgetMad: Number(r.budget_mad ?? 0),
    ficheVisibleSections: parseFicheVisibleSections(r.fiche_visible_sections),
  };
}

export function buildAdminProjectPayload(body: Record<string, unknown>) {
  const status = String(body.status || "active");
  const budgetMad = Math.max(0, Number(body.budgetMad ?? body.budget_mad ?? 0) || 0);
  const ficheVisibleSections =
    body.ficheVisibleSections === null || body.ficheVisibleSections === undefined
      ? body.ficheVisibleSections === null
        ? null
        : undefined
      : parseFicheVisibleSections(body.ficheVisibleSections);

  const payload: Record<string, unknown> = {
    code: String(body.code || "").trim(),
    name: String(body.name || "").trim(),
    client_name: String(body.clientName || "").trim(),
    status: STATUSES.includes(status as ProjectStatus) ? status : "active",
    start_date: body.startDate ? String(body.startDate).slice(0, 10) : null,
    end_date: body.endDate ? String(body.endDate).slice(0, 10) : null,
    location: String(body.location || "").trim(),
    address: String(body.address || "").trim(),
    manager_name: String(body.managerName || "").trim(),
    market_number: String(body.marketNumber || "").trim(),
    market_description: String(body.marketDescription || "").trim(),
    chantier_document_url: String(body.chantierDocumentUrl || "").trim(),
    plan_url: String(body.planUrl || "").trim(),
    notes: String(body.notes || "").trim(),
    budget_mad: budgetMad,
    updated_at: new Date().toISOString(),
  };

  if (ficheVisibleSections !== undefined) {
    payload.fiche_visible_sections = ficheVisibleSections;
  }

  return payload;
}
