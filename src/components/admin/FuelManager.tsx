"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { FuelView } from "@/lib/admin/fuel-nav";
import { FUEL_VIEW_META } from "@/lib/admin/fuel-nav";
import { btnPrimary, btnSecondary, moduleWrap } from "@/components/admin/admin-form-styles";
import { FuelManagerContentSkeleton } from "@/components/admin/skeletons/pages";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { FuelGasoilBonPanel } from "@/components/admin/FuelGasoilBonPanel";
import { FuelGasoilStockPanel, type FuelStockTab } from "@/components/admin/FuelGasoilStockPanel";
import { useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FuelManager({ view }: { view: FuelView }) {
  const toast = useAdminToast();
  const searchParams = useSearchParams();
  const meta = FUEL_VIEW_META[view];

  const { projects, materials, loading: refLoading, refresh: refreshRef } = useOpsReferential();

  const loadSummary = useCallback(async () => {
    await refreshRef();
  }, [refreshRef]);

  useEffect(() => {
    if (view === "stock") void loadSummary();
  }, [view, loadSummary]);

  const activeMaterials = materials.filter((m) => m.active);

  const showBanner = view === "bons" || view === "commande" || view === "stock";
  const needsReferential = view === "bons" || view === "commande" || view === "stock";

  const stockTab: FuelStockTab = searchParams.get("tab") === "journal" ? "journal" : "stock";

  const showHeaderExport = view !== "bons" && view !== "commande";

  if (needsReferential && refLoading) {
    return (
      <div className={moduleWrap}>
        <OpsModuleHeader
          title={meta.title}
          description={meta.description}
          exportHref={showHeaderExport ? meta.exportHref : undefined}
        />
        <FuelManagerContentSkeleton />
      </div>
    );
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={meta.title}
        description={meta.description}
        exportHref={showHeaderExport ? meta.exportHref : undefined}
        actions={
          view === "stock" ? (
            <>
              <Link href="/admin/fuel/consommation" className={btnSecondary}>
                Analyse matériel
              </Link>
              <Link href="/admin/fuel/bons" className={btnPrimary}>
                Nouveau bon de sortie
              </Link>
            </>
          ) : undefined
        }
      />

      {showBanner ? (
        <ReferentialBanner
          sitesCount={projects.length}
          equipmentCount={activeMaterials.length}
          requireSites
          requireEquipment
        />
      ) : null}

      {view === "stock" ? (
        <FuelGasoilStockPanel initialTab={stockTab} onUpdated={() => void loadSummary()} />
      ) : null}

      {view === "bons" ? (
        <FuelGasoilBonPanel
          fixedBonType="sortie"
          projects={projects}
          materials={materials}
          projectIdFromUrl={searchParams.get("project") ?? undefined}
          onStockUpdated={() => void loadSummary()}
        />
      ) : null}

      {view === "commande" ? (
        <FuelGasoilBonPanel
          fixedBonType="achat"
          projects={projects}
          materials={materials}
          projectIdFromUrl={searchParams.get("project") ?? undefined}
          onStockUpdated={() => void loadSummary()}
        />
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
