"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { AdminDepot } from "@/components/admin/operations-types";
import { DEPOT_TYPE_LABELS } from "@/components/admin/operations-types";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function DepotSelect({
  depots,
  value,
  onChange,
  placeholder = "Dépôt…",
  allowEmpty = true,
}: {
  depots: AdminDepot[];
  value: string;
  onChange: (depotId: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const options = useMemo((): SearchableSelectOption[] => {
    return depots.map((d) => ({
      value: d.id,
      label: `${d.name} (${DEPOT_TYPE_LABELS[d.depotType]})`,
      keywords: d.name,
    }));
  }, [depots]);

  if (depots.length === 0) {
    return (
      <p className="text-xs text-[#7a3d12]">
        Aucun dépôt —{" "}
        <Link href="/admin/depots" className="underline text-[var(--navy)]">
          créer un dépôt
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
