import type { AdminProject, ProjectStatus } from "@/components/admin/operations-types";

const STATUSES: ProjectStatus[] = ["draft", "active", "suspended", "closed"];

export function mapAdminProjectRow(r: Record<string, unknown>): AdminProject {
  const status = r.status as string;
  return {
    id: r.id as string,
    code: (r.code as string) || "",
    name: r.name as string,
    clientName: (r.client_name as string) || "",
    status: STATUSES.includes(status as ProjectStatus) ? (status as ProjectStatus) : "active",
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
  };
}

export function buildAdminProjectPayload(body: Record<string, unknown>) {
  const status = String(body.status || "active");
  return {
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
    updated_at: new Date().toISOString(),
  };
}
