import {
  SkeletonBackLink,
  SkeletonBanner,
  SkeletonFieldRow,
  SkeletonFilterBar,
  SkeletonFinanceDetailCard,
  SkeletonFormCard,
  SkeletonGasoilStockPanel,
  SkeletonInventoryCard,
  SkeletonMiniStats,
  SkeletonModuleHeader,
  SkeletonPage,
  SkeletonProjectCards,
  SkeletonQuoteBuilderBody,
  SkeletonQuoteBuilderHeader,
  SkeletonSheetForm,
  SkeletonTabs,
} from "@/components/admin/skeletons/primitives";

type PartialProps = { partial?: boolean };

export function TraitementsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement traitements" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonTabs labels={["Achat", "Vente"]} />
      <SkeletonTabs labels={["Liste", "Nouveau"]} />
      <SkeletonMiniStats count={3} />
      <SkeletonInventoryCard cols={9} rows={7} toolbarSelect filterFields={1} />
    </SkeletonPage>
  );
}

export function PurchaseRequestsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement demandes d'achat" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      {!partial ? <SkeletonMiniStats count={3} /> : null}
      {!partial ? <SkeletonTabs labels={["Liste", "Workflow"]} /> : null}
      <SkeletonInventoryCard cols={7} rows={8} toolbarSelect />
    </SkeletonPage>
  );
}

export function StockPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement stock" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      {!partial ? <SkeletonBanner /> : null}
      {!partial ? <SkeletonMiniStats count={4} /> : null}
      {!partial ? <SkeletonTabs labels={["Inventaire", "Dépôts", "Historique", "Alertes"]} /> : null}
      <SkeletonInventoryCard cols={9} rows={8} toolbarSelect />
    </SkeletonPage>
  );
}

export function StockDepotPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement stock dépôt" partial>
      <SkeletonInventoryCard cols={5} rows={6} hasSearch={false} />
    </SkeletonPage>
  );
}

export function ProjectsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement projets" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      {!partial ? <SkeletonMiniStats count={3} /> : null}
      {!partial ? <SkeletonTabs labels={["Cartes", "Nouveau"]} /> : null}
      {!partial ? <SkeletonFilterBar fields={1} /> : null}
      <SkeletonProjectCards count={6} />
    </SkeletonPage>
  );
}

export function ProjectHubSkeleton() {
  return (
    <SkeletonPage label="Chargement fiche projet">
      <SkeletonBackLink />
      <SkeletonModuleHeader actionCount={2} />
      <SkeletonBanner />
      <SkeletonTabs labels={["Vue d'ensemble", "États", "Finance", "Documents", "Historique"]} />
      <SkeletonMiniStats count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonInventoryCard cols={3} rows={4} hasSearch={false} />
        <SkeletonInventoryCard cols={3} rows={4} hasSearch={false} />
      </div>
    </SkeletonPage>
  );
}

export function ProjectFicheDashboardSkeleton() {
  return (
    <SkeletonPage label="Chargement fiche projet" partial>
      <SkeletonMiniStats count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonInventoryCard cols={2} rows={5} hasSearch={false} />
        <SkeletonInventoryCard cols={2} rows={5} hasSearch={false} />
      </div>
      <SkeletonInventoryCard cols={4} rows={4} hasSearch={false} />
    </SkeletonPage>
  );
}

export function ProjectFinancePanelSkeleton() {
  return (
    <SkeletonPage label="Chargement finance projet" partial>
      <SkeletonMiniStats count={3} />
      <SkeletonInventoryCard cols={5} rows={5} hasSearch={false} />
    </SkeletonPage>
  );
}

export function ProjectDocumentsPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement documents projet" partial>
      <SkeletonInventoryCard cols={4} rows={6} />
    </SkeletonPage>
  );
}

export function ProjectReportsPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement états projet" partial>
      <SkeletonFilterBar fields={2} />
      <SkeletonFormCard fields={4} />
    </SkeletonPage>
  );
}

export function CustomersPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement clients" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={5} rows={8} />
    </SkeletonPage>
  );
}

export function SuppliersPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement fournisseurs" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={5} rows={8} />
    </SkeletonPage>
  );
}

export function ProductsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement produits" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      {!partial ? <SkeletonTabs labels={["Catalogue", "Catégories"]} /> : null}
      <SkeletonInventoryCard cols={7} rows={8} toolbarSelect />
    </SkeletonPage>
  );
}

export function FinanceClientsPanelSkeleton({ embedded }: { embedded?: boolean } = {}) {
  return (
    <SkeletonPage label="Chargement factures clients" partial={embedded}>
      {!embedded ? <SkeletonModuleHeader actionCount={0} /> : null}
      <SkeletonInventoryCard cols={8} rows={7} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FinanceSuppliersPanelSkeleton({ embedded }: { embedded?: boolean } = {}) {
  return (
    <SkeletonPage label="Chargement factures fournisseurs" partial={embedded}>
      {!embedded ? <SkeletonModuleHeader actionCount={0} /> : null}
      <SkeletonInventoryCard cols={8} rows={7} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FinanceCaissePanelSkeleton() {
  return (
    <SkeletonPage label="Chargement caisse">
      <SkeletonModuleHeader actionCount={0} hasExport />
      <SkeletonMiniStats count={3} />
      <SkeletonFieldRow cols={4} />
      <SkeletonTabs labels={["Journal", "Entrée caisse", "Sortie caisse"]} />
      <SkeletonInventoryCard cols={6} rows={8} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FinanceBanquePanelSkeleton() {
  return (
    <SkeletonPage label="Chargement banque">
      <SkeletonModuleHeader actionCount={0} hasExport />
      <SkeletonMiniStats count={2} />
      <SkeletonFieldRow cols={3} />
      <SkeletonInventoryCard cols={6} rows={8} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FinanceTresoreriePanelSkeleton() {
  return (
    <SkeletonPage label="Chargement trésorerie">
      <SkeletonModuleHeader actionCount={0} />
      <SkeletonMiniStats count={4} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonInventoryCard cols={3} rows={5} hasSearch={false} />
        <SkeletonInventoryCard cols={3} rows={5} hasSearch={false} />
      </div>
    </SkeletonPage>
  );
}

export function FinanceExpensesPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement dépenses">
      <SkeletonModuleHeader actionCount={0} />
      <SkeletonFormCard fields={8} />
    </SkeletonPage>
  );
}

export function FinanceClosingsPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement clôtures">
      <SkeletonModuleHeader actionCount={1} />
      <SkeletonInventoryCard cols={5} rows={6} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FinanceDocumentDetailSkeleton() {
  return (
    <SkeletonPage label="Chargement facture">
      <SkeletonModuleHeader actionCount={1} />
      <SkeletonFinanceDetailCard />
      <SkeletonFormCard fields={4} />
      <SkeletonInventoryCard cols={5} rows={4} hasSearch={false} />
    </SkeletonPage>
  );
}

export function TraitementFinancePanelSkeleton() {
  return (
    <SkeletonPage label="Chargement finance traitement" partial>
      <SkeletonMiniStats count={3} />
      <SkeletonInventoryCard cols={4} rows={3} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FuelStockPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement stock gasoil" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={2} hasExport /> : null}
      {!partial ? <SkeletonBanner /> : null}
      {!partial ? <SkeletonTabs labels={["Stock & mouvements", "Journal consommation"]} /> : null}
      <SkeletonGasoilStockPanel />
    </SkeletonPage>
  );
}

export function FuelBonsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement bons gasoil" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      {!partial ? <SkeletonBanner /> : null}
      <SkeletonFormCard fields={6} />
      <SkeletonInventoryCard cols={7} rows={6} />
    </SkeletonPage>
  );
}

export function FuelJournalPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement journal gasoil" partial>
      <SkeletonFilterBar fields={2} />
      <SkeletonInventoryCard cols={6} rows={8} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FuelConsumptionPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement analyse consommation" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={2} /> : null}
      {!partial ? <SkeletonBanner /> : null}
      {!partial ? <SkeletonBanner /> : null}
      <SkeletonMiniStats count={5} />
      <SkeletonFilterBar fields={3} />
      <SkeletonInventoryCard cols={8} rows={8} hasSearch={false} />
    </SkeletonPage>
  );
}

export function FuelManagerContentSkeleton() {
  return (
    <SkeletonPage label="Chargement carburant" partial>
      <SkeletonBanner />
      <SkeletonGasoilStockPanel />
    </SkeletonPage>
  );
}

export function HrPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement RH" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      {!partial ? <SkeletonTabs labels={["Pointage", "Absences"]} /> : null}
      <SkeletonInventoryCard cols={6} rows={8} toolbarSelect />
    </SkeletonPage>
  );
}

export function PersonnelPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement personnel" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={6} rows={8} />
    </SkeletonPage>
  );
}

export function DepotsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement dépôts" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={4} rows={6} />
    </SkeletonPage>
  );
}

export function PartsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement pièces" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      <SkeletonInventoryCard cols={6} rows={8} toolbarSelect />
    </SkeletonPage>
  );
}

export function DrillingPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement forage" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={7} rows={7} />
    </SkeletonPage>
  );
}

export function ProductionPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement production" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={6} rows={7} />
    </SkeletonPage>
  );
}

export function LogisticsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement logistique" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={7} rows={7} />
    </SkeletonPage>
  );
}

export function EquipmentPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement engins" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} /> : null}
      <SkeletonInventoryCard cols={5} rows={7} />
    </SkeletonPage>
  );
}

export function RentalBonsPageSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement bons location" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={1} hasExport /> : null}
      {!partial ? <SkeletonBanner /> : null}
      <SkeletonInventoryCard cols={8} rows={7} toolbarSelect />
    </SkeletonPage>
  );
}

export function RentalMaterialsPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement catalogue matériel" partial>
      <SkeletonInventoryCard cols={6} rows={6} />
    </SkeletonPage>
  );
}

export function RentalManagerMaterialsSkeleton() {
  return (
    <SkeletonPage label="Chargement matériel" partial>
      <SkeletonInventoryCard cols={5} rows={5} />
    </SkeletonPage>
  );
}

export function SavedDevisListSkeleton({ partial }: PartialProps = {}) {
  return (
    <SkeletonPage label="Chargement documents" partial={partial}>
      {!partial ? <SkeletonModuleHeader actionCount={2} /> : null}
      {!partial ? <SkeletonTabs labels={["Tous", "Devis", "BC", "Factures", "BL"]} /> : null}
      {!partial ? <SkeletonFilterBar fields={0} /> : null}
      <SkeletonInventoryCard cols={6} rows={8} hasSearch={false} />
    </SkeletonPage>
  );
}

export function QuoteBuilderSkeleton() {
  return (
    <SkeletonPage label="Chargement éditeur document">
      <SkeletonQuoteBuilderHeader />
      <SkeletonQuoteBuilderBody />
    </SkeletonPage>
  );
}

export function GlobalEtatsPanelSkeleton() {
  return (
    <SkeletonPage label="Chargement états ERP">
      <SkeletonModuleHeader actionCount={1} />
      <SkeletonFilterBar fields={3} />
      <SkeletonFormCard fields={2} />
    </SkeletonPage>
  );
}

export function OrganizationMembersSkeleton() {
  return (
    <SkeletonPage label="Chargement membres" partial>
      <SkeletonInventoryCard cols={5} rows={6} hasSearch={false} />
    </SkeletonPage>
  );
}

export function SiteReportsPanelSkeleton({ embedded }: { embedded?: boolean } = {}) {
  return (
    <SkeletonPage label="Chargement rapports" partial={embedded}>
      {!embedded ? <SkeletonModuleHeader actionCount={1} /> : null}
      {!embedded ? <SkeletonTabs labels={["Liste", "Nouveau"]} /> : null}
      <SkeletonInventoryCard cols={6} rows={7} />
    </SkeletonPage>
  );
}

export function SitePvPanelSkeleton({ embedded }: { embedded?: boolean } = {}) {
  return (
    <SkeletonPage label="Chargement PV" partial={embedded}>
      {!embedded ? <SkeletonModuleHeader actionCount={1} /> : null}
      {!embedded ? <SkeletonTabs labels={["Liste", "Nouveau"]} /> : null}
      <SkeletonInventoryCard cols={5} rows={7} />
    </SkeletonPage>
  );
}

export function TraitementDocumentSheetSkeleton() {
  return (
    <SkeletonPage label="Chargement document" partial>
      <SkeletonSheetForm fields={6} />
    </SkeletonPage>
  );
}

export function TraitementPaymentPromptSkeleton() {
  return (
    <SkeletonPage label="Chargement paiement" partial>
      <SkeletonSheetForm fields={4} />
    </SkeletonPage>
  );
}
