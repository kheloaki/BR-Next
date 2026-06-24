"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/admin/admin-form-styles";
import { frDateToIso, isoToFrDate, normalizeTime24 } from "@/lib/admin/date-time-fr";

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Borderless layout for table cells (bon papier). */
  variant?: "default" | "inline";
};

export function FrenchDateInput({
  value,
  onChange,
  className,
  disabled,
  placeholder = "jj/mm/aaaa",
  variant = "default",
}: InputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => isoToFrDate(value));
  const isoValue = value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";

  useEffect(() => {
    setDraft(isoToFrDate(value));
  }, [value]);

  function commitDraft() {
    const iso = frDateToIso(draft);
    if (iso === null && draft.trim()) {
      setDraft(isoToFrDate(value));
      return;
    }
    if (iso !== null) {
      onChange(iso);
      setDraft(isoToFrDate(iso));
    }
  }

  function openPicker() {
    if (disabled) return;
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  }

  function onPickerChange(iso: string) {
    onChange(iso);
    setDraft(isoToFrDate(iso));
  }

  const fieldClass = className ?? inputClass;
  const inline = variant === "inline";

  return (
    <div className="relative flex min-w-0 items-stretch">
      <input
        type="text"
        inputMode="numeric"
        lang="fr-FR"
        autoComplete="off"
        className={
          inline
            ? `${fieldClass} min-w-0 flex-1`
            : `${fieldClass} min-w-0 flex-1 rounded-r-none pr-2`
        }
        disabled={disabled}
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitDraft();
          }
        }}
        onClick={openPicker}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Ouvrir le calendrier"
        className={
          inline
            ? "inline-flex shrink-0 items-center justify-center px-0.5 text-[var(--navy)] disabled:opacity-50"
            : "inline-flex shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-border bg-[var(--background)] px-2 text-[var(--navy)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        }
        onClick={openPicker}
      >
        <Calendar className={inline ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
        value={isoValue}
        disabled={disabled}
        onChange={(e) => onPickerChange(e.target.value)}
      />
    </div>
  );
}

export function FrenchTimeInput({
  value,
  onChange,
  className,
  disabled,
  placeholder = "14:30",
}: InputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value ? normalizeTime24(value) || value : "");
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      lang="fr-FR"
      autoComplete="off"
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={5}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const normalized = normalizeTime24(draft);
        if (!draft.trim()) {
          onChange("");
          setDraft("");
          return;
        }
        if (!normalized) {
          setDraft(value ? normalizeTime24(value) || value : "");
          return;
        }
        onChange(normalized);
        setDraft(normalized);
      }}
    />
  );
}
