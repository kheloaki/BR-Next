"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminDepot,
  AdminEmployee,
  AdminEquipment,
  AdminProject,
  AdminSite,
  RentalMaterial,
} from "@/components/admin/operations-types";
import { mapRentalMaterialRow } from "@/lib/admin/map-rental-material-catalog";

export function useOpsReferential() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [depots, setDepots] = useState<AdminDepot[]>([]);
  const [equipment, setEquipment] = useState<AdminEquipment[]>([]);
  const [materials, setMaterials] = useState<RentalMaterial[]>([]);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [projectsRes, depotsRes, eqRes, matRes, empRes] = await Promise.all([
      fetch("/api/admin/projects", { cache: "no-store" }),
      fetch("/api/admin/depots", { cache: "no-store" }),
      fetch("/api/admin/equipment", { cache: "no-store" }),
      fetch("/api/admin/rental-materials", { cache: "no-store" }),
      fetch("/api/admin/employees", { cache: "no-store" }),
    ]);
    if (projectsRes.ok) setProjects((await projectsRes.json()) as AdminProject[]);
    if (depotsRes.ok) setDepots((await depotsRes.json()) as AdminDepot[]);
    if (eqRes.ok) setEquipment((await eqRes.json()) as AdminEquipment[]);
    if (matRes.ok) {
      const raw = (await matRes.json()) as Record<string, unknown>[];
      setMaterials(raw.map((r) => mapRentalMaterialRow(r)));
    }
    if (empRes.ok) setEmployees((await empRes.json()) as AdminEmployee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const sites: AdminSite[] = projects.map((p) => ({ id: p.id, name: p.name }));

  return { projects, depots, sites, equipment, materials, employees, loading, refresh };
}
