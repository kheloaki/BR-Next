"use client";

import { useEffect, useState } from "react";
import { inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { formatMoney, htToTtc, ttcToHt } from "@/lib/admin/price-ht-ttc";

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

type HtTtcPriceFieldsProps = {
  vatRate: number;
  valueHt: number;
  onChangeHt: (ht: number) => void;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  /** When false, uses placeholders like other admin form fields (no labels above). */
  showLabels?: boolean;
};

export function HtTtcPriceFields({
  vatRate,
  valueHt,
  onChangeHt,
  className = "",
  compact: _compact = false,
  disabled = false,
  showLabels = true,
}: HtTtcPriceFieldsProps) {
  const ttc = htToTtc(valueHt, vatRate);
  const [htDraft, setHtDraft] = useState("");
  const [ttcDraft, setTtcDraft] = useState("");
  const [editing, setEditing] = useState<"ht" | "ttc" | null>(null);

  useEffect(() => {
    if (editing !== "ht") {
      setHtDraft(valueHt === 0 ? "" : String(valueHt));
    }
    if (editing !== "ttc") {
      setTtcDraft(ttc === 0 ? "" : String(ttc));
    }
  }, [valueHt, ttc, editing]);

  function commitHt(raw: string) {
    const n = parseAmount(raw);
    onChangeHt(n ?? 0);
  }

  function commitTtc(raw: string) {
    const n = parseAmount(raw);
    onChangeHt(n == null ? 0 : ttcToHt(n, vatRate));
  }

  const fieldClass = `${inputClass} tabular-nums`;

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div>
        {showLabels ? <label className={labelClass}>Prix HT</label> : null}
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className={`${fieldClass}${showLabels ? " mt-1" : ""}`}
          value={editing === "ht" ? htDraft : valueHt === 0 ? "" : String(valueHt)}
          onFocus={() => {
            setEditing("ht");
            setHtDraft(valueHt === 0 ? "" : String(valueHt));
          }}
          onBlur={() => {
            commitHt(htDraft);
            setEditing(null);
          }}
          onChange={(e) => {
            setHtDraft(e.target.value);
            const n = parseAmount(e.target.value);
            if (n != null) onChangeHt(n);
          }}
          placeholder={showLabels ? "0,00" : "Prix HT"}
        />
        {showLabels && editing !== "ttc" && valueHt > 0 ? (
          <p className="mt-0.5 text-[10px] text-[var(--graphite)]/60">TTC : {formatMoney(ttc)}</p>
        ) : null}
      </div>
      <div>
        {showLabels ? <label className={labelClass}>Prix TTC</label> : null}
        <input
          type="text"
          inputMode="decimal"
          disabled={disabled}
          className={`${fieldClass}${showLabels ? " mt-1" : ""}`}
          value={editing === "ttc" ? ttcDraft : ttc === 0 ? "" : String(ttc)}
          onFocus={() => {
            setEditing("ttc");
            setTtcDraft(ttc === 0 ? "" : String(ttc));
          }}
          onBlur={() => {
            commitTtc(ttcDraft);
            setEditing(null);
          }}
          onChange={(e) => {
            setTtcDraft(e.target.value);
            const n = parseAmount(e.target.value);
            if (n != null) onChangeHt(ttcToHt(n, vatRate));
          }}
          placeholder={showLabels ? "0,00" : "Prix TTC"}
        />
        {showLabels && editing !== "ht" && ttc > 0 ? (
          <p className="mt-0.5 text-[10px] text-[var(--graphite)]/60">HT : {formatMoney(valueHt)}</p>
        ) : null}
      </div>
    </div>
  );
}
