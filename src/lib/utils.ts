import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Coerce Prisma Decimal | number | string | null into a plain number for
 * arithmetic, comparisons, chart data, and React children. Decimal fields are
 * stored exactly in Postgres; JS floats are only used at the display edge.
 */
export function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
