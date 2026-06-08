export type AdminQuickAction = {
  href: string;
  label: string;
  hint?: string;
};

export type AdminQuickActionGroup = {
  label: string;
  actions: AdminQuickAction[];
};

/** Sticky + menu — créations et accès rapides ERP (aligné sur la sidebar). */
export const ADMIN_QUICK_ACTION_GROUPS: AdminQuickActionGroup[] = [
  {
    label: "Commercial",
    actions: [{ href: "/admin/facturation/documents", label: "Documents enregistrés" }],
  },
  {
    label: "Chantiers",
    actions: [
      { href: "/admin/projets", label: "Projets" },
      { href: "/admin/etats", label: "États ERP" },
      { href: "/admin/fuel/consommation", label: "Conso. & location" },
    ],
  },
  {
    label: "Approvisionnement",
    actions: [
      { href: "/admin/purchase-requests?new=1", label: "Nouvelle DA", hint: "Articles ou gasoil" },
      { href: "/admin/traitements-achat?new=1", label: "Traitement achat" },
      { href: "/admin/traitements-vente?new=1", label: "Traitement vente" },
      { href: "/admin/stock", label: "Stock" },
    ],
  },
  {
    label: "Matériel & location",
    actions: [
      { href: "/admin/equipment-rental/materials", label: "Catalogue matériel" },
      { href: "/admin/equipment-rental/bons", label: "Bon location" },
    ],
  },
  {
    label: "Carburant",
    actions: [
      { href: "/admin/purchase-requests?new=gasoil", label: "DA gasoil" },
      { href: "/admin/traitements-achat?new=1", label: "Traitement achat gasoil", hint: "BC / réception" },
      { href: "/admin/fuel/bons", label: "Bon de sortie gasoil" },
      { href: "/admin/fuel/stock", label: "Stock gasoil" },
    ],
  },
  {
    label: "Finance",
    actions: [
      { href: "/admin/finance/caisse", label: "Caisse" },
      { href: "/admin/finance/banque", label: "Banque" },
      { href: "/admin/finance/etats", label: "États finance" },
    ],
  },
  {
    label: "Référentiel",
    actions: [
      { href: "/admin/customers", label: "Clients" },
      { href: "/admin/suppliers", label: "Fournisseurs" },
      { href: "/admin/products", label: "Produits" },
    ],
  },
  {
    label: "Ressources humaines",
    actions: [{ href: "/admin/hr", label: "RH & pointage" }],
  },
];
