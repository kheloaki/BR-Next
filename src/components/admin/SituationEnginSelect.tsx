"use client";

import { useEffect, useMemo, useState } from "react";
import type { RentalMaterial } from "@/components/admin/operations-types";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";

type Props = {
  projectId: string;
  value: string;
  onChange: (materialId: string) => void;
};

export function SituationEnginSelect({ projectId, value, onChange }: Props) {
  const [materials, setMaterials] = useState<RentalMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setMaterials([]);
      return;
    }
    setLoading(true);
    void fetch("/api/admin/rental-materials", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: RentalMaterial[]) => {
        setMaterials(
          rows.filter(
            (m) =>
              m.active &&
              m.materialCategory === "engin" &&
              (!m.projectId || m.projectId === projectId),
          ),
        );
      })
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  const options = useMemo((): SearchableSelectOption[] => {
    return materials
      .map((m) => ({
        value: m.id,
        label: materialLabel(m),
        keywords: `${m.matricule} ${m.reference} ${m.designation}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [materials]);

  if (!projectId) {
    return <p className="text-xs text-[var(--graphite)]/65">Sélectionnez d&apos;abord un chantier.</p>;
  }

  if (loading) {
    return <p className="text-xs text-[var(--graphite)]/65">Chargement des engins…</p>;
  }

  if (materials.length === 0) {
    return (
      <p className="text-xs text-[#7a3d12]">
        Aucun engin sur ce chantier — saisissez les bons location ou ajoutez le matériel au catalogue.
      </p>
    );
  }

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Tous les engins du chantier"
      allowEmpty
    />
  );
}
