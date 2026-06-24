/** Unique non-empty strings, sorted for filter dropdowns. */
export function uniqueSortedLabels(values: Iterable<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

export function scopeByProjectId<T extends { projectId: string | null }>(
  rows: T[],
  projectId: string,
): T[] {
  if (!projectId) return rows;
  return rows.filter((row) => row.projectId === projectId);
}

/** Clear a filter value when it is no longer in the allowed options. */
export function pruneFilterValue(current: string, options: string[]): string {
  if (!current) return current;
  return options.includes(current) ? current : "";
}

export type FacetCheck<T> = {
  key: string;
  active: string;
  test: (row: T) => boolean;
};

/** Rows matching all active facet filters except optionally one key (for option lists). */
export function applyFacetScope<T>(
  rows: T[],
  checks: FacetCheck<T>[],
  excludeKey?: string,
): T[] {
  return rows.filter((row) =>
    checks.every(({ key, active, test }) => {
      if (!active) return true;
      if (excludeKey === key) return true;
      return test(row);
    }),
  );
}

export function uniqueProjectIds(rows: { projectId: string | null }[]): string[] {
  return [...new Set(rows.map((row) => row.projectId).filter((id): id is string => Boolean(id)))];
}

export function projectsFromIds<T extends { id: string }>(projects: T[], ids: string[]): T[] {
  if (ids.length === 0) return [];
  const allowed = new Set(ids);
  return projects.filter((project) => allowed.has(project.id));
}

/** When facet scope yields no ids but source rows exist, return []; if no rows yet, return all projects. */
export function projectsForFacetScope<T extends { id: string }>(
  projects: T[],
  scopedRows: { projectId: string | null }[],
): T[] {
  const ids = uniqueProjectIds(scopedRows);
  if (ids.length > 0) return projectsFromIds(projects, ids);
  return scopedRows.length === 0 && projects.length > 0 ? projects : [];
}

export function facetEnumOptions<T extends string, R>(
  all: T[],
  scopedRows: R[],
  totalRowCount: number,
  getter: (row: R) => T | null | undefined,
): T[] {
  if (scopedRows.length === 0) return totalRowCount === 0 ? all : [];
  const present = new Set<T>();
  for (const row of scopedRows) {
    const value = getter(row);
    if (value) present.add(value);
  }
  return all.filter((item) => present.has(item));
}

export function facetStringOptions<R>(
  scopedRows: R[],
  totalRowCount: number,
  getter: (row: R) => string | null | undefined,
): string[] {
  if (scopedRows.length === 0) return totalRowCount === 0 ? [] : [];
  return uniqueSortedLabels(scopedRows.map(getter));
}

export function pruneProjectId(current: string, projects: { id: string }[]): string {
  if (!current) return current;
  return projects.some((project) => project.id === current) ? current : "";
}
