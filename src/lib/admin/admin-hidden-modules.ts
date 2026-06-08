/** Modules masqués — pages « Bientôt disponible », absents de la navigation. */
export const ADMIN_HIDDEN_MODULE_PATHS = [
  "/admin/drilling",
  "/admin/production",
  "/admin/logistics",
  "/admin/pv",
  "/admin/rapports",
] as const;

export type AdminHiddenModulePath = (typeof ADMIN_HIDDEN_MODULE_PATHS)[number];

export function isAdminHiddenModulePath(pathname: string): boolean {
  return ADMIN_HIDDEN_MODULE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const ADMIN_HIDDEN_MODULE_LABELS: Record<AdminHiddenModulePath, string> = {
  "/admin/drilling": "Rapport foration",
  "/admin/production": "Production",
  "/admin/logistics": "Logistique & voyages",
  "/admin/pv": "Procès-verbaux",
  "/admin/rapports": "Rapports chantier",
};
