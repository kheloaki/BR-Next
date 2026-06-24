import type { AdminProject } from "@/components/admin/operations-types";

export type ProjectFicheSectionId =
  | "gasoil"
  | "rentals"
  | "production"
  | "drilling"
  | "logistics"
  | "personnel"
  | "purchases"
  | "stock"
  | "materials"
  | "labor"
  | "payments"
  | "expenses"
  | "costs";

export type ProjectFicheSectionDef = {
  id: ProjectFicheSectionId;
  label: string;
  description: string;
  adminHref?: string;
};

export const PROJECT_FICHE_SECTION_GROUPS: { label: string; sections: ProjectFicheSectionDef[] }[] = [
  {
    label: "Activité chantier",
    sections: [
      {
        id: "gasoil",
        label: "Carburant / gasoil",
        description: "Sorties et consommation gasoil",
        adminHref: "/admin/fuel/journal",
      },
      {
        id: "rentals",
        label: "Location matériel",
        description: "Bons de location et montants",
        adminHref: "/admin/equipment-rental",
      },
      {
        id: "production",
        label: "Production",
        description: "Tonnages et objectifs",
        adminHref: "/admin/production",
      },
      {
        id: "drilling",
        label: "Forage",
        description: "Rapports de forage",
        adminHref: "/admin/drilling",
      },
      {
        id: "logistics",
        label: "Logistique / transport",
        description: "Trajets et distances",
        adminHref: "/admin/logistics",
      },
      {
        id: "personnel",
        label: "Personnel / pointage",
        description: "Présences et heures",
        adminHref: "/admin/hr",
      },
      {
        id: "purchases",
        label: "Demandes d'achat (DA)",
        description: "DA et montants",
        adminHref: "/admin/purchase-requests",
      },
      {
        id: "stock",
        label: "Mouvements stock",
        description: "Entrées et sorties magasin",
        adminHref: "/admin/stock",
      },
    ],
  },
  {
    label: "Synthèse financière",
    sections: [
      {
        id: "materials",
        label: "Matériaux consommés",
        description: "Pièces et consommables",
        adminHref: "/admin/parts",
      },
      {
        id: "labor",
        label: "Main d'œuvre",
        description: "Saisies MO chantier",
        adminHref: "/admin/personnel",
      },
      {
        id: "payments",
        label: "Paiements clients",
        description: "Encaissements reçus",
        adminHref: "/admin/finance/factures?tab=clients",
      },
      {
        id: "expenses",
        label: "Dépenses",
        description: "Sorties caisse / banque",
        adminHref: "/admin/finance/depenses",
      },
      {
        id: "costs",
        label: "Coûts & graphique",
        description: "Répartition et évolution",
      },
    ],
  },
];

export const ALL_PROJECT_FICHE_SECTION_IDS: ProjectFicheSectionId[] =
  PROJECT_FICHE_SECTION_GROUPS.flatMap((g) => g.sections.map((s) => s.id));

export function parseFicheVisibleSections(raw: unknown): ProjectFicheSectionId[] | null {
  if (!Array.isArray(raw)) return null;
  const ids = raw.filter((x): x is ProjectFicheSectionId =>
    typeof x === "string" && ALL_PROJECT_FICHE_SECTION_IDS.includes(x as ProjectFicheSectionId),
  );
  return ids.length > 0 ? ids : null;
}

export function isProjectFicheSectionVisible(
  project: Pick<AdminProject, "ficheVisibleSections">,
  sectionId: ProjectFicheSectionId,
): boolean {
  const vis = project.ficheVisibleSections;
  if (!vis || vis.length === 0) return true;
  return vis.includes(sectionId);
}

export function normalizeFicheVisibleSections(
  selected: ProjectFicheSectionId[],
): ProjectFicheSectionId[] | null {
  if (selected.length >= ALL_PROJECT_FICHE_SECTION_IDS.length) return null;
  return selected;
}
