export type SortDirection = "asc" | "desc";

export type SortState = {
  key: string;
  dir: SortDirection;
};

export function compareSortValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null || a === "") return 1;
  if (b == null || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return 0;
    if (Number.isNaN(a)) return 1;
    if (Number.isNaN(b)) return -1;
    return a - b;
  }
  return String(a).localeCompare(String(b), "fr", { numeric: true, sensitivity: "base" });
}

export function nextSortState(current: SortState | null, key: string): SortState {
  if (current?.key === key) {
    return { key, dir: current.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: "asc" };
}

export function applyTableSort<T>(
  rows: T[],
  sort: SortState | null,
  accessors: Record<string, (row: T) => unknown>,
): T[] {
  if (!sort?.key) return rows;
  const accessor = accessors[sort.key];
  if (!accessor) return rows;
  const dir = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => dir * compareSortValues(accessor(a), accessor(b)));
}
