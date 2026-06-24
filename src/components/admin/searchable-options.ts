import type { SearchableSelectOption } from "@/components/admin/SearchableSelect";

export function enumToOptions(labels: Record<string, string>): SearchableSelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export function withEmptyOption(
  options: SearchableSelectOption[],
  emptyLabel: string,
): SearchableSelectOption[] {
  return [{ value: "", label: emptyLabel }, ...options];
}

export function idNameOptions(
  items: { id: string; name: string }[],
  formatLabel?: (item: { id: string; name: string }) => string,
): SearchableSelectOption[] {
  return items.map((item) => ({
    value: item.id,
    label: formatLabel ? formatLabel(item) : item.name,
    keywords: item.name,
  }));
}

export function stringOptions(values: string[]): SearchableSelectOption[] {
  return values.map((value) => ({ value, label: value, keywords: value }));
}
