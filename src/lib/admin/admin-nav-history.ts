import { ADMIN_RETURN_PARAM } from "@/lib/admin/admin-return-url";

const STORAGE_KEY = "barane-admin-nav-stack-v1";
const MAX_STACK = 50;
const LIST_FORM_PARAMS = new Set(["id", "new"]);

let skipNextHistoryPush = false;

/** Call before programmatic back navigation so the previous page is not re-pushed. */
export function markAdminNavBackNavigation() {
  skipNextHistoryPush = true;
}

export function consumeSkipAdminNavPush(): boolean {
  if (skipNextHistoryPush) {
    skipNextHistoryPush = false;
    return true;
  }
  return false;
}

function readStack(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((u): u is string => typeof u === "string" && u.startsWith("/admin"))
      : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-MAX_STACK)));
}

export function normalizeAdminHistoryUrl(url: string): string {
  const [path, query = ""] = url.split("?");
  if (!query) return path;
  const qs = new URLSearchParams(query);
  qs.delete(ADMIN_RETURN_PARAM);
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

function stripListFormQuery(query: string): string {
  const qs = new URLSearchParams(query);
  qs.delete("id");
  qs.delete("new");
  return qs.toString();
}

/** True when navigation changes admin module/page (not list ↔ form on same route). */
export function isCrossPageAdminNav(from: string, to: string): boolean {
  const fromNorm = normalizeAdminHistoryUrl(from);
  const toNorm = normalizeAdminHistoryUrl(to);
  if (fromNorm === toNorm) return false;

  const [fromPath, fromQuery = ""] = fromNorm.split("?");
  const [toPath, toQuery = ""] = toNorm.split("?");

  if (fromPath !== toPath) return true;
  return stripListFormQuery(fromQuery) !== stripListFormQuery(toQuery);
}

export function pushAdminNavHistory(url: string) {
  const normalized = normalizeAdminHistoryUrl(url);
  if (!normalized.startsWith("/admin")) return;
  const stack = readStack();
  if (stack[stack.length - 1] === normalized) return;
  stack.push(normalized);
  writeStack(stack);
}

export function peekAdminNavBack(currentUrl: string): string | null {
  const current = normalizeAdminHistoryUrl(currentUrl);
  const stack = readStack();
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i] !== current) return stack[i];
  }
  return null;
}

export function popAdminNavBack(currentUrl: string): string | null {
  const current = normalizeAdminHistoryUrl(currentUrl);
  const stack = readStack();
  while (stack.length > 0 && stack[stack.length - 1] === current) {
    stack.pop();
  }
  while (stack.length > 0) {
    const entry = stack.pop()!;
    if (entry !== current) {
      writeStack(stack);
      return entry;
    }
  }
  writeStack(stack);
  return null;
}

/** Parent list route when there is no remembered history. */
export function adminFallbackBack(pathname: string): string {
  if (pathname.startsWith("/admin/projets/")) return "/admin/projets";
  if (pathname.startsWith("/admin/finance/factures/")) return "/admin/finance/factures";
  if (pathname.startsWith("/admin/finance/clients/")) return "/admin/finance/clients";
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 2) {
    return `/${parts.slice(0, -1).join("/")}`;
  }
  return "/admin";
}
