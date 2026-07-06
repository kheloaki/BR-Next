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
    <div className="mb-5 overflow-x-auto touch-pan-x overscroll-x-contain">
      <div className="inline-flex min-w-max gap-1 rounded-[var(--admin-radius-pill)] border border-border/60 bg-[var(--muted)]/80 p-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-[var(--admin-radius-pill)] px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-[var(--navy)] shadow-[var(--admin-shadow)]"
                  : "text-[var(--graphite)] hover:bg-white/60 hover:text-[var(--navy)]"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 ? (
                <span
                  className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-[var(--admin-radius-pill)] px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]"
                      : "bg-white/80 text-[var(--graphite)]"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
