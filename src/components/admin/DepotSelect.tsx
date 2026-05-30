import Link from "next/link";
import type { AdminDepot } from "@/components/admin/operations-types";
import { DEPOT_TYPE_LABELS } from "@/components/admin/operations-types";
import { inputClass } from "@/components/admin/admin-form-styles";

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
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {depots.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name} ({DEPOT_TYPE_LABELS[d.depotType]})
        </option>
      ))}
    </select>
  );
}
