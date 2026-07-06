import { statCard } from "@/components/admin/admin-form-styles";

export function AdminMiniStats({
  items,
}: {
  items: { label: string; value: string; hint?: string; accent?: "gold" | "navy" | "alert" }[];
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${statCard} ${item.accent === "alert" ? "border-amber-200/80 bg-amber-50/50" : ""}`}
        >
          <p className="text-[10px] uppercase tracking-wide text-[var(--graphite)]/65">{item.label}</p>
          <p
            className={`mt-0.5 text-lg font-semibold ${
              item.accent === "alert" ? "text-amber-800" : "text-[var(--navy)]"
            }`}
          >
            {item.value}
          </p>
          {item.hint ? <p className="mt-0.5 text-[10px] text-[var(--graphite)]/60">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
