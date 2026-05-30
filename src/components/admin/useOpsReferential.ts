"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminDepot, AdminEmployee, AdminEquipment, AdminProject, AdminSite } from "@/components/admin/operations-types";

export function useOpsReferential() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [depots, setDepots] = useState<AdminDepot[]>([]);
  const [equipment, setEquipment] = useState<AdminEquipment[]>([]);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [projectsRes, depotsRes, eqRes, empRes] = await Promise.all([
      fetch("/api/admin/projects", { cache: "no-store" }),
      fetch("/api/admin/depots", { cache: "no-store" }),
      fetch("/api/admin/equipment", { cache: "no-store" }),
      fetch("/api/admin/employees", { cache: "no-store" }),
    ]);
    if (projectsRes.ok) setProjects((await projectsRes.json()) as AdminProject[]);
    if (depotsRes.ok) setDepots((await depotsRes.json()) as AdminDepot[]);
    if (eqRes.ok) setEquipment((await eqRes.json()) as AdminEquipment[]);
    if (empRes.ok) setEmployees((await empRes.json()) as AdminEmployee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sites: AdminSite[] = projects.map((p) => ({ id: p.id, name: p.name }));

  return { projects, depots, sites, equipment, employees, loading, refresh };
}
