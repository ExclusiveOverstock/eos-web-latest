import type { ProductStatus } from "@/lib/shopify/types";

/**
 * Whether a lot is open, in the EOS voice.
 *
 * NO COUNTS. This component used to print the number of pieces left — "05
 * Remaining", with a scarcity dot under three. That was removed by
 * instruction: the site no longer tells anyone how much stock exists.
 *
 * What survives is the part that was never a number. A lot is open or it is
 * closed, and a closed lot says it will not return, which remains true and
 * is the whole argument. Scarcity is now a property of the model rather than
 * a figure on the page.
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
          Lot Closed
        </span>
        <p className="eos-meta-sm mt-3 text-taupe">This piece will not return.</p>
      </div>
    ) : (
      <span
        className={`eos-meta-sm inline-flex items-center gap-2 text-taupe ${className}`}
      >
        <span aria-hidden="true" className="h-1 w-1 bg-oxblood" />
        Lot Closed
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
