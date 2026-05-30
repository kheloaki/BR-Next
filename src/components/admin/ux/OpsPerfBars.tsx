export function OpsPerfBars({
  items,
  barClassName = "bg-[var(--gold)]",
}: {
  items: { label: string; value: number; suffix?: string }[];
  barClassName?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--graphite)]/70">Aucune donnée pour l&apos;instant.</p>;
  }
  const max = items[0]?.value || 1;
  return (
    <div className="space-y-2">
      {items.map(({ label, value, suffix = "" }) => (
        <div key={label} className="rounded-md border border-border bg-white px-4 py-2.5">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-medium text-[var(--navy)]">{label}</span>
            <span className="tabular-nums text-[var(--graphite)]">
              {value.toLocaleString("fr-MA")}
              {suffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eee]">
            <div
              className={`h-full transition-all ${barClassName}`}
              style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
