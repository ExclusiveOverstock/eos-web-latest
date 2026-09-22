import type { Money } from "./types";

export function formatMoney(money: Money): string {
  const amount = Number(money.amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Zero-padded quantity — "06 REMAINING", not "6 remaining".
 *
 * The pad is a brand decision, not a formatting nicety: it gives every lot
 * count the same width, so a column of them reads as a manifest rather than
 * as ragged marketing copy.
 */
export function pad2(n: number): string {
  return String(Math.max(0, Math.trunc(n))).padStart(2, "0");
}
