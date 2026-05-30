export function AdminLoading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 justify-center text-sm text-[var(--graphite)]/70">
      <span className="h-4 w-4 rounded-full border-2 border-[var(--gold)]/40 border-t-[var(--gold)] animate-spin" />
      {label}
    </div>
  );
}
