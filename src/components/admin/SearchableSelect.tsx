"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { inputClass, inputClassDense } from "@/components/admin/admin-form-styles";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

type Props = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchOption(option: SearchableSelectOption, query: string) {
  if (!query) return true;
  const haystack = normalizeSearch(`${option.label} ${option.keywords ?? ""}`);
  return haystack.includes(query);
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— Choisir —",
  compact = false,
  className,
  inputClassName,
  disabled = false,
  allowEmpty = true,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(isSearching ? query.trim() : "");
    return options.filter((o) => matchOption(o, q));
  }, [options, query, isSearching]);

  const updateCoords = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 2, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const onScrollOrResize = () => updateCoords();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, query, filtered.length, updateCoords]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const list = document.getElementById(listId);
      if (list?.contains(target)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, listId]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    setIsSearching(false);
    inputRef.current?.blur();
  }

  function handleFocus() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setIsSearching(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (open && filtered[activeIndex]) {
        selectOption(filtered[activeIndex]!);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      setIsSearching(false);
      return;
    }

    if (event.key === "Tab") {
      setOpen(false);
      setQuery("");
      setIsSearching(false);
    }
  }

  const displayValue = open && isSearching ? query : (selected?.label ?? "");
  const inputCls = inputClassName ?? (compact ? `${inputClassDense} pr-8` : `${inputClass} pr-9`);

  const dropdown =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          filtered.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="max-h-56 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 300,
              }}
            >
              {filtered.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    index === activeIndex
                      ? "bg-[var(--gold)]/15 text-[var(--navy)]"
                      : "text-[var(--graphite)] hover:bg-[var(--background)]"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-[var(--graphite)]/70 shadow-lg"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 300,
              }}
            >
              Aucun résultat
            </div>
          ) : null,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className ?? ""}`}>
      <input
        ref={inputRef}
        type="text"
        className={inputCls}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onFocus={handleFocus}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setIsSearching(true);
          setOpen(true);
          if (!next.trim() && allowEmpty && value) onChange("");
        }}
        onKeyDown={handleKeyDown}
      />
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--graphite)]/45"
        aria-hidden
      >
        ▾
      </span>
      {dropdown}
    </div>
  );
}
