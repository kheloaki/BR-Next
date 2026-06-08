"use client";

import { useCallback, useEffect, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { RentalBonPanel } from "@/components/admin/RentalBonPanel";
import { RentalMaterialPanel } from "@/components/admin/RentalMaterialPanel";
import type { MaterialDetailCategory, RentalMaterial, GasoilContact } from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
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
  const { projects } = useOpsReferential();
  const [materials, setMaterials] = useState<RentalMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(view === "materials" || view === "bons");
  const [materialDetailCategories, setMaterialDetailCategories] = useState<MaterialDetailCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [gasoilContacts, setGasoilContacts] = useState<GasoilContact[]>([]);
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

  const loadMaterialFormRefs = useCallback(async () => {
    const [suppliersRes, contactsRes] = await Promise.all([
      fetch("/api/admin/suppliers?supplyType=materiel", { cache: "no-store" }),
      fetch("/api/admin/gasoil-contacts", { cache: "no-store" }),
    ]);
    if (suppliersRes.ok) setSuppliers((await suppliersRes.json()) as Supplier[]);
    if (contactsRes.ok) setGasoilContacts((await contactsRes.json()) as GasoilContact[]);
  }, []);

  useEffect(() => {
    void loadMaterials();
    if (view === "materials") void loadBonCount();
  }, [loadMaterials, loadBonCount, view]);

  useEffect(() => {
    if (view === "bons" || view === "materials") {
      void (async () => {
        const mdcRes = await fetch("/api/admin/material-detail-categories", { cache: "no-store" });
        if (mdcRes.ok) setMaterialDetailCategories((await mdcRes.json()) as MaterialDetailCategory[]);
      })();
    }
  }, [view]);

  useEffect(() => {
    if (view === "materials" || view === "bons") void loadMaterialFormRefs();
  }, [view, loadMaterialFormRefs]);

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
          projects={projects}
          suppliers={suppliers}
          gasoilContacts={gasoilContacts}
          onSuppliersChange={setSuppliers}
          onGasoilContactsChange={setGasoilContacts}
          materialDetailCategories={materialDetailCategories}
          onMaterialDetailCategoriesChange={setMaterialDetailCategories}
        />
      ) : null}

      {!materialsLoading && view === "bons" ? (
        <RentalBonPanel
          toast={toast}
          materials={materials}
          projects={projects}
          gasoilContacts={gasoilContacts}
          onGasoilContactsChange={setGasoilContacts}
        />
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
