"use client";

import { useMemo } from "react";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { inputClass, labelClass } from "@/components/admin/admin-form-styles";

export const VAT_RATE_PRESETS = [0, 7, 10, 14, 20] as const;

const VAT_RATE_OTHER = [5, 12, 15, 18] as const;

const pillBase =
  "inline-flex shrink-0 items-center justify-center rounded-[var(--admin-radius-pill)] border px-2.5 py-1.5 text-sm font-medium transition active:scale-[0.98]";

function pillClass(selected: boolean) {
  return selected
    ? `${pillBase} border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]`
    : `${pillBase} border-border bg-white text-[var(--navy)] hover:bg-[var(--muted)]`;
}

export function VatRateSelect({
  value,
  onChange,
  label = "TVA",
  compact = false,
}: {
  value: number;
  onChange: (rate: number) => void;
  label?: string;
  compact?: boolean;
}) {
  const presetSelected = VAT_RATE_PRESETS.includes(value as (typeof VAT_RATE_PRESETS)[number]);
  const otherSelected = VAT_RATE_OTHER.includes(value as (typeof VAT_RATE_OTHER)[number]);

  const compactOptions = useMemo(
    () => [
      ...VAT_RATE_PRESETS.map((rate) => ({
        value: String(rate),
        label: `${rate} %${rate === 20 ? " (défaut)" : ""}`,
      })),
      ...VAT_RATE_OTHER.map((rate) => ({
        value: String(rate),
        label: `${rate} %`,
      })),
    ],
    [],
  );

  const otherOptions = useMemo(
    () => VAT_RATE_OTHER.map((rate) => ({ value: String(rate), label: `${rate}%` })),
    [],
  );

  if (compact) {
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <div className="mt-1">
          <SearchableSelect
            options={compactOptions}
            value={String(value)}
            onChange={(v) => onChange(Number(v))}
            inputClassName={`${inputClass} max-w-xs`}
            allowEmpty={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {VAT_RATE_PRESETS.map((rate) => (
          <button key={rate} type="button" className={pillClass(value === rate)} onClick={() => onChange(rate)}>
            {rate}%
          </button>
        ))}
        <SearchableSelect
          options={otherOptions}
          value={presetSelected || otherSelected ? "" : String(value)}
          onChange={(v) => {
            const n = Number(v);
            if (Number.isFinite(n)) onChange(n);
          }}
          placeholder="Autre…"
          inputClassName={`${inputClass} w-auto min-w-[5.5rem] px-2 py-1.5 text-sm`}
          allowEmpty
          compact
        />
      </div>
      {!presetSelected && !otherSelected ? (
        <p className="mt-1 text-xs text-[var(--graphite)]/65">Taux appliqué : {value} %</p>
      ) : null}
    </div>
  );
}
