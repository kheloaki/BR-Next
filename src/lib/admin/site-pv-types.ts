export type SitePvType =
  | "reunion_chantier"
  | "visite_chantier"
  | "reception_provisoire"
  | "reception_definitive"
  | "levee_reserves"
  | "mise_disposition_materiel"
  | "retour_materiel"
  | "incident";

export type SitePvStatus =
  | "draft"
  | "sent"
  | "signed"
  | "accepted"
  | "accepted_with_reserves"
  | "rejected"
  | "archived";

export type PvParticipant = {
  name: string;
  role?: string;
  company?: string;
};

export type PvAction = {
  task: string;
  responsible: string;
  deadline?: string;
};

export type PvSignature = {
  role: string;
  name: string;
  signedAt?: string;
};

export interface SitePv {
  id: string;
  projectId: string | null;
  pvType: SitePvType;
  number: string;
  status: SitePvStatus;
  pvDate: string;
  object: string;
  observations: string;
  decisions: string;
  reserves: string;
  participants: PvParticipant[];
  actions: PvAction[];
  responsiblePerson: string;
  deadline: string | null;
  signatures: PvSignature[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SITE_PV_TYPE_LABELS: Record<SitePvType, string> = {
  reunion_chantier: "PV de réunion chantier",
  visite_chantier: "PV de visite chantier",
  reception_provisoire: "PV de réception provisoire",
  reception_definitive: "PV de réception définitive",
  levee_reserves: "PV de levée des réserves",
  mise_disposition_materiel: "PV mise à disposition matériel",
  retour_materiel: "PV retour matériel",
  incident: "PV incident / casse / arrêt",
};

export const SITE_PV_STATUS_LABELS: Record<SitePvStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  signed: "Signé",
  accepted: "Accepté",
  accepted_with_reserves: "Accepté avec réserves",
  rejected: "Rejeté",
  archived: "Archivé",
};

export const SITE_PV_TYPES: SitePvType[] = [
  "reunion_chantier",
  "visite_chantier",
  "reception_provisoire",
  "reception_definitive",
  "levee_reserves",
  "mise_disposition_materiel",
  "retour_materiel",
  "incident",
];
