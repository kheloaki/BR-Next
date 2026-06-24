"use client";

import { useMemo } from "react";
import type { AdminEquipment } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";
import { ReferentialEmptyHint } from "@/components/admin/ReferentialEmptyHint";
import { SearchableSelect } from "@/components/admin/SearchableSelect";

export function EquipmentSelect({
  equipment,
  value,
  onChange,
  activeOnly = true,
}: {
  equipment: AdminEquipment[];
  value: string;
  onChange: (id: string) => void;
  activeOnly?: boolean;
}) {
  const list = activeOnly ? equipment.filter((e) => e.active) : equipment;

  const options = useMemo(
    () =>
      list.map((e) => ({
        value: e.id,
        label: `${e.name}${e.type ? ` (${e.type})` : ""}`,
        keywords: `${e.name} ${e.type ?? ""}`,
      })),
    [list],
  );

  if (list.length === 0) {
    return <ReferentialEmptyHint label="matériel" managePage="rental-materials" />;
  }

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Engin…"
      inputClassName={inputClass}
    />
  );
}
