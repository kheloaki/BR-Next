"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { facturationBuilderPath } from "@/lib/admin/facturation-nav";

const MANUAL = "__manual__";

function blLabel(bl: QuoteDraft) {
  const parts = [bl.quoteNumber || bl.reference || "Sans n°"];
  if (bl.clientName?.trim()) parts.push(bl.clientName.trim());
  if (bl.date) parts.push(bl.date);
  return parts.join(" — ");
}

export function DeliveryNoteSelect({
  value,
  onChange,
  label = "N° BL / référence",
  placeholder = "— Sélectionner un bon de livraison —",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}) {
  const [bls, setBls] = useState<QuoteDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (res.ok) {
        const all = (await res.json()) as QuoteDraft[];
        setBls(all.filter((q) => q.documentType === "bon_livraison"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const blOptions = useMemo(
    () => [...bls].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [bls],
  );

  const options = useMemo(() => {
    const rows = blOptions
      .map((bl) => {
        const num = bl.quoteNumber || bl.reference;
        if (!num) return null;
        return {
          value: num,
          label: blLabel(bl),
          keywords: `${num} ${bl.clientName ?? ""}`,
        };
      })
      .filter(Boolean) as { value: string; label: string; keywords: string }[];
    return [...rows, { value: MANUAL, label: "Autre (saisie manuelle)", keywords: "manuel autre" }];
  }, [blOptions]);

  const knownNumbers = useMemo(
    () => new Set(options.filter((o) => o.value !== MANUAL).map((o) => o.value)),
    [options],
  );

  const isKnown = value.trim() !== "" && knownNumbers.has(value.trim());
  const showManualInput = manual || (value.trim() !== "" && !isKnown);
  const selectValue = showManualInput ? MANUAL : value;

  function handleSelectChange(next: string) {
    if (next === MANUAL) {
      setManual(true);
      return;
    }
    setManual(false);
    onChange(next);
  }

  return (
    <div className={className}>
      {label ? <p className={labelClass}>{label}</p> : null}
      <div className={`${label ? "mt-1" : ""} flex gap-2`}>
        <SearchableSelect
          options={options}
          value={selectValue}
          onChange={handleSelectChange}
          placeholder={loading ? "Chargement des BL…" : placeholder}
          inputClassName={`${inputClass} min-w-0 flex-1`}
          disabled={loading}
          allowEmpty={false}
        />
        <Link
          href={facturationBuilderPath("bon_livraison")}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnSecondary} min-w-[44px] shrink-0 px-3 text-lg font-semibold leading-none`}
          title="Nouveau bon de livraison"
          aria-label="Nouveau bon de livraison"
        >
          +
        </Link>
      </div>
      {showManualInput ? (
        <input
          className={`${inputClass} mt-2`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="N° BL ou référence libre"
        />
      ) : null}
      {!loading && blOptions.length === 0 ? (
        <p className="mt-1.5 text-xs text-[var(--graphite)]/65">
          Aucun bon de livraison enregistré — cliquez sur + pour en créer un.
        </p>
      ) : null}
    </div>
  );
}
