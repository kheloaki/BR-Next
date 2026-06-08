export type SiteReportType =
  | "journalier"
  | "hebdomadaire"
  | "avancement"
  | "production"
  | "photos"
  | "gasoil"
  | "materiel"
  | "personnel";

export type SiteReportStatus = "draft" | "submitted" | "validated" | "archived";

export interface SiteReport {
  id: string;
  projectId: string | null;
  reportType: SiteReportType;
  number: string;
  status: SiteReportStatus;
  reportDate: string;
  periodFrom: string | null;
  periodTo: string | null;
  activities: string;
  quantities: string;
  blockers: string;
  nextActions: string;
  notes: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SITE_REPORT_TYPE_LABELS: Record<SiteReportType, string> = {
  journalier: "Rapport journalier",
  hebdomadaire: "Rapport hebdomadaire",
  avancement: "Rapport avancement",
  production: "Rapport production",
  photos: "Rapport photos",
  gasoil: "Rapport consommation gasoil",
  materiel: "Rapport matériel sur chantier",
  personnel: "Rapport personnel présent",
};

export const SITE_REPORT_STATUS_LABELS: Record<SiteReportStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumis",
  validated: "Validé",
  archived: "Archivé",
};

export const SITE_REPORT_TYPES: SiteReportType[] = [
  "journalier",
  "hebdomadaire",
  "avancement",
  "production",
  "photos",
  "gasoil",
  "materiel",
  "personnel",
];
