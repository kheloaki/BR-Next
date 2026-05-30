export function opsId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
