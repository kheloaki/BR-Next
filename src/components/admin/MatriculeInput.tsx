"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass } from "@/components/admin/admin-form-styles";
import {
  formatMatricule,
  parseMatricule,
  type MatriculeParts,
} from "@/lib/admin/moroccan-matricule";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  className?: string;
  partClassName?: string;
  disabled?: boolean;
  compact?: boolean;
  /** Emit onChange only when focus leaves the group (inline table edits). */
  deferCommit?: boolean;
};

export function MatriculeInput({
  value,
  onChange,
  onBlur,
  className = "",
  partClassName,
  disabled = false,
  compact = false,
  deferCommit = false,
}: Props) {
  const baseId = useId();
  const letterRef = useRef<HTMLInputElement>(null);
  const wilayaRef = useRef<HTMLInputElement>(null);
  const [parts, setParts] = useState<MatriculeParts>(() => parseMatricule(value));

  useEffect(() => {
    setParts(parseMatricule(value));
  }, [value]);

  const partInputClass =
    partClassName ??
    (compact
      ? "w-full min-w-0 border-0 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-[var(--graphite)]/40"
      : `${inputClass} min-w-0 px-2 py-2 text-center tabular-nums`);

  function emit(next: MatriculeParts) {
    setParts(next);
    const formatted = formatMatricule(next);
    if (!deferCommit) onChange(formatted);
    return formatted;
  }

  function commitBlur() {
    const formatted = formatMatricule(parts);
    if (deferCommit) onChange(formatted);
    onBlur?.(formatted);
  }

  function patch(key: keyof MatriculeParts, raw: string) {
    let next: MatriculeParts;
    if (key === "serial") {
      next = { ...parts, serial: raw.replace(/\D/g, "").slice(0, 5) };
      if (next.serial.length >= 5 && !parts.letter) letterRef.current?.focus();
    } else if (key === "letter") {
      const letter = raw.replace(/[^A-Za-z\u0600-\u06FF]/g, "").slice(0, 1).toUpperCase();
      next = { ...parts, letter };
      if (letter && !parts.wilaya) wilayaRef.current?.focus();
    } else {
      next = { ...parts, wilaya: raw.replace(/\D/g, "").slice(0, 2) };
    }
    emit(next);
  }

  const sepClass = compact
    ? "shrink-0 text-[10px] text-[var(--graphite)]/45"
    : "shrink-0 px-0.5 text-xs font-medium text-[var(--graphite)]/50";

  return (
    <div
      className={`flex min-w-0 items-center gap-1 ${className}`}
      role="group"
      aria-label="Matricule"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) commitBlur();
      }}
    >
      <input
        id={`${baseId}-serial`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${partInputClass} ${compact ? "flex-[1.4]" : "w-[5.5rem]"}`}
        placeholder="12345"
        maxLength={5}
        disabled={disabled}
        value={parts.serial}
        onChange={(e) => patch("serial", e.target.value)}
      />
      <span className={sepClass} aria-hidden>
        |
      </span>
      <input
        ref={letterRef}
        id={`${baseId}-letter`}
        type="text"
        autoComplete="off"
        className={`${partInputClass} ${compact ? "w-7" : "w-10"} uppercase`}
        placeholder="A"
        maxLength={1}
        disabled={disabled}
        value={parts.letter}
        onChange={(e) => patch("letter", e.target.value)}
      />
      <span className={sepClass} aria-hidden>
        |
      </span>
      <input
        ref={wilayaRef}
        id={`${baseId}-wilaya`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${partInputClass} ${compact ? "w-9" : "w-12"}`}
        placeholder="12"
        maxLength={2}
        disabled={disabled}
        value={parts.wilaya}
        onChange={(e) => patch("wilaya", e.target.value)}
      />
    </div>
  );
}
