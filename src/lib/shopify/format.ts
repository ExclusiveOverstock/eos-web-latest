import type { Money } from "./types";

/**
 * Money, always whole.
 *
 * This used to show two decimals whenever the amount had them, which was
 * fine while every price was typed by hand and round. Discounts broke that:
 * 20% off PKR 1,499 is 1,199.20, and a storefront full of
 * "PKR 1,199.20" reads like a spreadsheet rather than a price.
 *
 * So fractions are never shown. The rupee has no sub-unit in practical
 * circulation, so there is nothing being hidden that anyone would pay.
 *
 * WHAT THIS DOES NOT DO: change what is charged. Shopify holds the real
 * amount and the checkout settles on it, so a price displayed as PKR 1,199
 * can be charged as 1,199.20. The gap is at most one rupee and it is a
 * display decision, not an arithmetic one. If a currency with meaningful
 * minor units is ever added — the placeholder fixture is in USD — this is
 * the function to revisit, because hiding cents there would be wrong.
 */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(money.amount));
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
