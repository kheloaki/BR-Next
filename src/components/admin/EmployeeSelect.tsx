"use client";

import { useMemo } from "react";
import type { AdminEmployee } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";
import { ReferentialEmptyHint } from "@/components/admin/ReferentialEmptyHint";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

export function EmployeeSelect({
  employees,
  value,
  onChange,
}: {
  employees: AdminEmployee[];
  value: string;
  onChange: (id: string) => void;
}) {
  const options = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.cin ? `${e.cin} — ` : ""}${e.name}${e.role ? ` (${e.role})` : ""}`,
        keywords: `${e.cin ?? ""} ${e.name} ${e.role ?? ""}`,
      })),
    [employees],
  );

  if (employees.length === 0) {
    return <ReferentialEmptyHint label="collaborateur" managePage="personnel" />;
  }

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Employé…"
      inputClassName={inputClass}
    />
  );
}
