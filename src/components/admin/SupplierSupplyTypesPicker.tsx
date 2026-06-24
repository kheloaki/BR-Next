"use client";

import { useCallback, useEffect, useState } from "react";
import {
  btnPrimary,
  btnSecondary,
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  inputClass,
  labelClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import type { SupplierSupplyTypeOption } from "@/lib/admin/supplier-supply-type-catalog";

export function SupplierSupplyTypesPicker({
  value,
  onChange,
  label = "Types d'approvisionnement",
  required = true,
  className = "",
  onOptionsChange,
}: {
  value: string[];
  onChange: (types: string[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  onOptionsChange?: (options: SupplierSupplyTypeOption[]) => void;
}) {
  const [options, setOptions] = useState<SupplierSupplyTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/supplier-supply-types", { cache: "no-store" });
    if (res.ok) {
      const rows = (await res.json()) as SupplierSupplyTypeOption[];
      setOptions(rows);
      onOptionsChange?.(rows);
    }
    setLoading(false);
  }, [onOptionsChange]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleType(slug: string) {
    onChange(
      value.includes(slug)
        ? value.length > 1
          ? value.filter((x) => x !== slug)
          : value
        : [...value, slug],
    );
  }

  async function submitType() {
    const labelValue = newLabel.trim();
    if (!labelValue) {
      setError("Indiquez le nom du type.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/supplier-supply-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: labelValue }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const data = (await res.json()) as {
      created: SupplierSupplyTypeOption;
      options: SupplierSupplyTypeOption[];
    };
    setOptions(data.options);
    onOptionsChange?.(data.options);
    if (!value.includes(data.created.slug)) {
      onChange([...value, data.created.slug]);
    }
    setNewLabel("");
    setOpen(false);
  }

  return (
    <>
      <div className={className}>
        <div className="flex items-center justify-between gap-2">
          <p className={labelClass}>
            {label}
            {required ? " *" : ""}
          </p>
          <button
            type="button"
            className={`${btnSecondary} shrink-0 px-3 py-1 text-sm`}
            onClick={() => {
              setError(null);
              setNewLabel("");
              setOpen(true);
            }}
            title="Ajouter un type d'approvisionnement"
            aria-label="Ajouter un type d'approvisionnement"
          >
            +
          </button>
        </div>
        {loading ? (
          <p className="mt-2 text-sm text-[var(--graphite)]/65">Chargement des types…</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                className={value.includes(opt.slug) ? categorySegmentBtnSelected : categorySegmentBtnUnselected}
                onClick={() => toggleType(opt.slug)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau type d'approvisionnement"
        description="Ex. Quincaillerie, Béton, Location courte durée…"
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitType()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <AdminSheetField label="Nom du type" required>
          <input
            className={inputClass}
            placeholder="Ex. Béton, Quincaillerie…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitType();
            }}
          />
        </AdminSheetField>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
