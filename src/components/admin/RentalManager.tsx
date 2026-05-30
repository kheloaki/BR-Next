"use client";

import { useCallback, useEffect, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { RentalBonPanel } from "@/components/admin/RentalBonPanel";
import { RentalMaterialPanel } from "@/components/admin/RentalMaterialPanel";
import type { PersonnelCategory, RentalMaterial } from "@/components/admin/operations-types";
import { moduleWrap } from "@/components/admin/admin-form-styles";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { useAdminToast } from "@/components/admin/ux/useAdminToast";
import type { RentalView } from "@/lib/admin/rental-nav";
import { RENTAL_VIEW_META } from "@/lib/admin/rental-nav";

export function RentalManager({ view }: { view: RentalView }) {
  const toast = useAdminToast();
  const meta = RENTAL_VIEW_META[view];
  const { projects, employees, refresh: refreshRef } = useOpsReferential();
  const [materials, setMaterials] = useState<RentalMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(view === "materials" || view === "bons");
  const [personnelCategories, setPersonnelCategories] = useState<PersonnelCategory[]>([]);
  const [bonCount, setBonCount] = useState<number | null>(view === "bons" ? null : 0);

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    const res = await fetch("/api/admin/rental-materials", { cache: "no-store" });
    if (res.ok) setMaterials((await res.json()) as RentalMaterial[]);
    setMaterialsLoading(false);
  }, []);

  const loadBonCount = useCallback(async () => {
    const res = await fetch("/api/admin/rentals", { cache: "no-store" });
    if (res.ok) {
      const rows = (await res.json()) as unknown[];
      setBonCount(rows.length);
    }
  }, []);

  useEffect(() => {
    void loadMaterials();
    if (view === "materials") void loadBonCount();
  }, [loadMaterials, loadBonCount, view]);

  useEffect(() => {
    if (view !== "bons") return;
    void (async () => {
      const res = await fetch("/api/admin/personnel-categories", { cache: "no-store" });
      if (res.ok) setPersonnelCategories((await res.json()) as PersonnelCategory[]);
    })();
  }, [view]);

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={meta.title}
        description={meta.description}
        exportHref={meta.exportHref}
      />

      {view === "materials" && !materialsLoading && bonCount !== null ? (
        <AdminMiniStats
          items={[
            { label: "Matériel", value: String(materials.length) },
            { label: "Bons location", value: String(bonCount) },
          ]}
        />
      ) : null}

      {materialsLoading ? <AdminLoading /> : null}

      {!materialsLoading && view === "materials" ? (
        <RentalMaterialPanel
          toast={toast}
          materials={materials}
          loading={false}
          onRefresh={loadMaterials}
        />
      ) : null}

      {!materialsLoading && view === "bons" ? (
        <RentalBonPanel
          toast={toast}
          materials={materials}
          projects={projects}
          employees={employees}
          personnelCategories={personnelCategories}
          onPersonnelCategoriesChange={setPersonnelCategories}
          onEmployeesRefresh={refreshRef}
        />
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
