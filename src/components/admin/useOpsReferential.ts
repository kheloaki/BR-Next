"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminDepot,
  AdminEmployee,
  AdminEquipment,
  AdminProject,
  AdminSite,
  RentalMaterial,
} from "@/components/admin/operations-types";

/** Min delay before auto-refresh when the tab becomes visible again. */
const VISIBILITY_REFETCH_MS = 60_000;

export function useOpsReferential() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [depots, setDepots] = useState<AdminDepot[]>([]);
  const [equipment, setEquipment] = useState<AdminEquipment[]>([]);
  const [materials, setMaterials] = useState<RentalMaterial[]>([]);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchedAtRef = useRef(0);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
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
    if (matRes.ok) setMaterials((await matRes.json()) as RentalMaterial[]);
    if (empRes.ok) setEmployees((await empRes.json()) as AdminEmployee[]);
    lastFetchedAtRef.current = Date.now();
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchedAtRef.current < VISIBILITY_REFETCH_MS) return;
      void refresh({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  const sites: AdminSite[] = projects.map((p) => ({ id: p.id, name: p.name }));

  return { projects, depots, sites, equipment, materials, employees, loading, refresh };
}
