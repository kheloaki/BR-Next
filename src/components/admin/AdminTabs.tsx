"use client";

export function AdminTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border mb-5 -mx-1 px-1">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition rounded-t-md ${
              isActive
                ? "border-[var(--gold)] text-[var(--navy)] bg-white"
                : "border-transparent text-[var(--graphite)]/70 hover:text-[var(--navy)] hover:bg-white/60"
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 ? (
              <span
                className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? "bg-[var(--gold)]/20 text-[var(--navy)]" : "bg-[var(--background)] text-[var(--graphite)]"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
