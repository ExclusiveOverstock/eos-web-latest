import { formatMoney } from "@/lib/shopify/format";
import type { Money } from "@/lib/shopify/types";

/**
 * A price, and what it used to be.
 *
 * One component for every surface that shows money, so a markdown cannot
 * appear on a card and be missing on the product page.
 *
 * NO SALE CHROME. There is no red badge, no percentage flash, no "WAS /
 * NOW", no countdown. The old figure is struck through in taupe and the
 * current one sits beside it in bone, which is the same decision the rest
 * of the site makes: scarcity got typography rather than alarm, and so does
 * price. Discount furniture is the fastest way to make a fashion site look
 * like a marketplace, which is the one thing the brief rules out.
 *
 * The saving is not printed as a percentage either. Two numbers side by side
 * already say it, and a percentage invites the reader to check the
 * arithmetic — which on a rounded price is rarely a round number.
 *
 * `compareAt` is ignored unless it is genuinely higher. Shopify allows a
 * compare-at equal to the price, and "PKR 1,800, was PKR 1,800" is noise.
 */
export default function Price({
  amount,
  compareAt,
  size = "sm",
  className = "",
}: {
  amount: Money;
  compareAt?: Money | null;
  /** `sm` for cards and rows, `lg` for the product page. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const reduced =
    compareAt && Number(compareAt.amount) > Number(amount.amount)
      ? compareAt
      : null;

  const type = size === "lg" ? "eos-meta" : "eos-meta-sm";

  if (!reduced) {
    return (
      <span className={`${type} text-bone ${className}`}>
        {formatMoney(amount)}
      </span>
    );
  }

  return (
    <span className={`${type} inline-flex flex-wrap items-baseline gap-x-3 ${className}`}>
      <span className="text-bone">{formatMoney(amount)}</span>
      {/*
        `line-through` on taupe rather than on bone: the old price is
        reference, not the thing being offered, and striking the brighter
        colour makes the cancelled number the loudest item in the row.

        It is read out as "was …" so a screen reader does not announce two
        bare prices and leave the listener to work out which one applies.
      */}
      <span className="text-taupe line-through decoration-taupe/70">
        <span className="sr-only">was </span>
        {formatMoney(reduced)}
      </span>
    </span>
  );
}
