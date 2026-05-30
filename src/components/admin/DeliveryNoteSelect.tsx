"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { btnSecondary, inputClass, labelClass } from "@/components/admin/admin-form-styles";
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

  const options = useMemo(
    () => [...bls].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
    [bls],
  );

  const knownNumbers = useMemo(
    () => new Set(options.flatMap((bl) => [bl.quoteNumber, bl.reference].filter(Boolean))),
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
        <select
          className={`${inputClass} min-w-0 flex-1`}
          value={selectValue}
          disabled={loading}
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="">{loading ? "Chargement des BL…" : placeholder}</option>
          {options.map((bl) => {
            const num = bl.quoteNumber || bl.reference;
            if (!num) return null;
            return (
              <option key={bl.id} value={num}>
                {blLabel(bl)}
              </option>
            );
          })}
          <option value={MANUAL}>Autre (saisie manuelle)</option>
        </select>
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
      {!loading && options.length === 0 ? (
        <p className="mt-1.5 text-xs text-[var(--graphite)]/65">
          Aucun bon de livraison enregistré — cliquez sur + pour en créer un.
        </p>
      ) : null}
    </div>
  );
}