import type { AdminProject, AdminSite } from "@/components/admin/operations-types";
import { ProjectSelect } from "@/components/admin/ProjectSelect";

/** @deprecated Use ProjectSelect with project id */
export function SiteSelect({
  sites,
  projects,
  value,
  onChange,
  placeholder = "Projet / chantier…",
  allowEmpty = true,
}: {
  sites?: AdminSite[];
  projects?: AdminProject[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const list: AdminProject[] =
    projects ??
    (sites ?? []).map((s) => ({
      id: s.id,
      code: "",
      name: s.name,
      clientName: "",
      status: "active" as const,
      startDate: null,
      endDate: null,
      location: "",
      address: "",
      managerName: "",
      marketNumber: "",
      marketDescription: "",
      chantierDocumentUrl: "",
      planUrl: "",
      notes: "",
    }));

  const byName = list.find((p) => p.name === value);
  const idValue = byName?.id ?? (list.some((p) => p.id === value) ? value : "");

  return (
    <ProjectSelect
      projects={list}
      value={idValue}
      onChange={(id) => {
        const p = list.find((x) => x.id === id);
        onChange(p?.name ?? id);
      }}
      placeholder={placeholder}
      allowEmpty={allowEmpty}
    />
  );
}
