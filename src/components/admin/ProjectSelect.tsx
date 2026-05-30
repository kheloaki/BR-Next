import Link from "next/link";
import type { AdminProject } from "@/components/admin/operations-types";
import { PROJECT_STATUS_LABELS } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";

export function ProjectSelect({
  projects,
  value,
  onChange,
  placeholder = "Projet / chantier…",
  allowEmpty = true,
  activeOnly = true,
}: {
  projects: AdminProject[];
  value: string;
  onChange: (projectId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  activeOnly?: boolean;
}) {
  const list = activeOnly ? projects.filter((p) => p.status === "active" || p.id === value) : projects;

  if (list.length === 0) {
    return (
      <p className="text-xs text-[#7a3d12]">
        Aucun projet —{" "}
        <Link href="/admin/projets" className="underline text-[var(--navy)]">
          créer un projet
        </Link>
        .
      </p>
    );
  }

  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {list.map((p) => (
        <option key={p.id} value={p.id}>
          {p.code ? `${p.code} — ` : ""}
          {p.name}
          {p.status !== "active" ? ` (${PROJECT_STATUS_LABELS[p.status]})` : ""}
        </option>
      ))}
    </select>
  );
}
