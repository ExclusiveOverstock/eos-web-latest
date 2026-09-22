import { pad2 } from "@/lib/shopify/format";
import type { ProductStatus } from "@/lib/shopify/types";

/**
 * Scarcity, in the EOS voice.
 *
 * Inventory is part of the brand here, so it gets typography rather than a
 * badge. No "LOW STOCK!" pill, no countdown, no colour-coded alarm — the
 * count is stated plainly and the fact that it will not come back is stated
 * once, quietly, underneath. That reads as true; urgency chrome reads as
 * marketing, which is the opposite of what scarcity should feel like on a
 * site built around limited existing inventory.
 *
 * Oxblood appears only as a mark: a dot when the lot is nearly gone, a
 * filled ground when it has closed. It is never the text colour on black —
 * see the note in globals.css.
 *
 * THREE STATES, NOT TWO. A quantity of `null` means Shopify would not tell
 * us the count — inventory tracking off, or the app missing the inventory
 * scope. That is not the same as zero, and it must never render as one:
 * "00 REMAINING" over a lot that is actually in stock is the single most
 * damaging thing this component could say. It shows availability instead
 * and omits the number entirely.
 */

const SCARCE_AT = 3;

export default function LotStatus({
  status,
  quantity,
  size = "sm",
  className = "",
}: {
  status: ProductStatus;
  /** Pieces left, or null when the count is unknown. */
  quantity: number | null;
  /** `sm` for cards and rows, `lg` for product and experience pages. */
  size?: "sm" | "lg";
  className?: string;
}) {
  const closed = status === "CLOSED" || quantity === 0;
  const unknown = quantity === null;

  if (closed) {
    return size === "lg" ? (
      <div className={className}>
        <span className="eos-meta inline-block bg-oxblood px-3 py-1.5 text-bone">
          Lot Closed
        </span>
        <p className="eos-meta-sm mt-3 text-taupe">
          This piece will not return.
        </p>
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

  // Open, but the count is not available. Say only what is known.
  if (unknown) {
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

  if (size === "lg") {
    return (
      <div className={`flex items-baseline gap-3 ${className}`}>
        <span className="eos-display-sm text-[2.75rem] leading-none text-bone tabular-nums">
          {pad2(quantity)}
        </span>
        <span className="eos-meta text-taupe">Remaining</span>
        {quantity <= SCARCE_AT && (
          <span
            aria-hidden="true"
            className="mb-1 h-1.5 w-1.5 self-end bg-oxblood"
          />
        )}
      </div>
    );
  }

  return (
    <span
      className={`eos-meta-sm inline-flex items-center gap-2 text-bone ${className}`}
    >
      {quantity <= SCARCE_AT && (
        <span aria-hidden="true" className="h-1 w-1 bg-oxblood" />
      )}
      {pad2(quantity)} Remaining
    </span>
  );
}
