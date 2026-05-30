export function AdminMiniStats({
  items,
}: {
  items: { label: string; value: string; hint?: string; accent?: "gold" | "navy" | "alert" }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-md border border-border bg-white px-3 py-2.5 ${
            item.accent === "alert" ? "border-[#f0d4b8] bg-[#fffbf7]" : ""
          }`}
        >
          <p className="text-[10px] uppercase tracking-wide text-[var(--graphite)]/65">{item.label}</p>
          <p
            className={`text-lg font-semibold mt-0.5 ${
              item.accent === "alert" ? "text-[#b04a09]" : "text-[var(--navy)]"
            }`}
          >
            {item.value}
          </p>
          {item.hint ? <p className="text-[10px] text-[var(--graphite)]/60 mt-0.5">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
