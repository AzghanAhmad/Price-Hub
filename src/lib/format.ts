export function formatPKR(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  return 'Rs. ' + value.toLocaleString('en-PK');
}

export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function genInvoiceNo(): string {
  const d = new Date();
  const stamp =
    d.getFullYear().toString().slice(-2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${stamp}-${rand}`;
}

export function classNames(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ');
}

export function sanitizeText(s: string): string {
  // strip any html tags for safe display in user-generated content
  return s.replace(/<[^>]*>/g, '').slice(0, 2000);
}
