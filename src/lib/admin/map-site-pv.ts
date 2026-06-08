import type {
  PvAction,
  PvParticipant,
  PvSignature,
  SitePv,
  SitePvStatus,
  SitePvType,
} from "@/lib/admin/site-pv-types";

function parseParticipants(raw: unknown): PvParticipant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const o = p as Record<string, unknown>;
      const name = String(o.name ?? "").trim();
      if (!name) return null;
      return {
        name,
        role: o.role ? String(o.role) : undefined,
        company: o.company ? String(o.company) : undefined,
      };
    })
    .filter(Boolean) as PvParticipant[];
}

function parseActions(raw: unknown): PvAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (!a || typeof a !== "object") return null;
      const o = a as Record<string, unknown>;
      const task = String(o.task ?? "").trim();
      if (!task) return null;
      return {
        task,
        responsible: String(o.responsible ?? "").trim(),
        deadline: o.deadline ? String(o.deadline).slice(0, 10) : undefined,
      };
    })
    .filter(Boolean) as PvAction[];
}

function parseSignatures(raw: unknown): PvSignature[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const o = s as Record<string, unknown>;
      return {
        role: String(o.role ?? ""),
        name: String(o.name ?? ""),
        signedAt: o.signedAt ? String(o.signedAt) : undefined,
      };
    })
    .filter(Boolean) as PvSignature[];
}

export function mapSitePvRow(r: Record<string, unknown>): SitePv {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    pvType: r.pv_type as SitePvType,
    number: r.number as string,
    status: r.status as SitePvStatus,
    pvDate: String(r.pv_date ?? "").slice(0, 10),
    object: (r.object as string) || "",
    observations: (r.observations as string) || "",
    decisions: (r.decisions as string) || "",
    reserves: (r.reserves as string) || "",
    participants: parseParticipants(r.participants),
    actions: parseActions(r.actions),
    responsiblePerson: (r.responsible_person as string) || "",
    deadline: r.deadline ? String(r.deadline).slice(0, 10) : null,
    signatures: parseSignatures(r.signatures),
    createdBy: (r.created_by as string) || null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
