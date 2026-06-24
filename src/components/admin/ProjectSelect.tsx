"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminProject } from "@/components/admin/operations-types";
import { PROJECT_STATUS_LABELS } from "@/components/admin/operations-types";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

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

  const options = useMemo((): SearchableSelectOption[] => {
    return list.map((p) => ({
      value: p.id,
      label: `${p.code ? `${p.code} — ` : ""}${p.name}${
        p.status !== "active" ? ` (${PROJECT_STATUS_LABELS[p.status]})` : ""
      }`,
      keywords: `${p.code ?? ""} ${p.name}`,
    }));
  }, [list]);

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
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowEmpty={allowEmpty}
    />
  );
}
