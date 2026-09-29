import type { ProductStatus } from "@/lib/shopify/types";

/**
 * Whether a lot is open, in the EOS voice.
 *
 * NO COUNTS. This component used to print the number of pieces left — "05
 * Remaining", with a scarcity dot under three. That was removed by
 * instruction: the site no longer tells anyone how much stock exists.
 *
 * What survives is the part that was never a number: a lot is available or
 * it is out of stock.
 *
 * A sold-out lot used to read "Lot Closed / This piece will not return".
 * That was changed to "Out of Stock / Restocking soon" by instruction. The
 * two say opposite things, and the older line still appears elsewhere on the
 * site — see the note at the foot of this file.
 *
 * Inventory still drives this. `status` is derived from live Shopify
 * availability, so selling the last piece still closes the lot with nobody
 * touching anything — the count is simply no longer shown.
 *
 * Oxblood appears only as a mark: a dot beside a closed row, a filled ground
 * on the product page. It is never the text colour on black — see the note
 * in globals.css.
 */
export default function LotStatus({
  status,
  size = "sm",
  className = "",
}: {
  status: ProductStatus;
  /** `sm` for cards and rows, `lg` for the product page. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const closed = status === "CLOSED";

  if (closed) {
    return size === "lg" ? (
      <div className={className}>
        <span className="eos-meta inline-block bg-oxblood px-3 py-1.5 text-bone">
          Out of Stock
        </span>
        <p className="eos-meta-sm mt-3 text-taupe">Restocking soon.</p>
      </div>
    ) : (
      <span
        className={`eos-meta-sm inline-flex items-center gap-2 text-taupe ${className}`}
      >
        <span aria-hidden="true" className="h-1 w-1 bg-oxblood" />
        Out of Stock
      </span>
    );
  }

  return size === "lg" ? (
    <div className={className}>
      <span className="eos-meta text-bone">Available</span>
      <p className="eos-meta-sm mt-3 text-taupe">
        Limited to the pieces that exist.
      </p>
    </div>
  ) : (
    <span className={`eos-meta-sm text-bone ${className}`}>Available</span>
  );
}

/*
  A CONTRADICTION WORTH RESOLVING.

  This component now says a sold-out piece is "Restocking soon". Two other
  places still say the opposite, because they were written when a lot never
  returned and were not part of the instruction to change this:

    HeroExperience  "Listed once. Never made again."
    Footer          "Listed once. Closed for good."

  Both are load-bearing brand lines rather than incidental copy. If stock now
  returns, they are no longer true and should be rewritten; if they are still
  true, this component should not promise a restock. One of the two has to
  give.
*/