import { pad2 } from "@/lib/shopify/format";
import { getManifest } from "@/lib/shopify/catalog";

/**
 * The running manifest.
 *
 * A ticker of every lot and what is left of it. It reads as a wire feed
 * rather than as a promotion, which is the point — the scarcity on this site
 * is meant to be a fact about the inventory, not a device, and a line of
 * plain records states that far better than a banner would.
 *
 * Entries come from the data layer rather than a hardcoded list, so a lot
 * that closes goes to CLOSED here without anyone remembering to update it.
 */
function Entry({
  lot,
  item,
  qty,
  closed,
}: {
  lot: string;
  item: string;
  /** Null when the count is unknown — see LotStatus. */
  qty: number | null;
  closed: boolean;
}) {
  return (
    <div className="eos-meta-sm flex shrink-0 items-center gap-3 whitespace-nowrap px-7 text-[10px]">
      <span className="text-bone">{lot}</span>
      <span className="text-taupe">{item}</span>
      <span className="text-hairline-strong">·</span>
      {closed ? (
        <span className="flex items-center gap-2 text-taupe">
          <span aria-hidden="true" className="h-1 w-1 bg-oxblood" />
          Lot Closed
        </span>
      ) : qty === null ? (
        <span className="text-bone">Available</span>
      ) : (
        <span className="tabular-nums text-bone">{pad2(qty)} Remaining</span>
      )}
      <span className="ml-4 text-hairline-strong">/</span>
    </div>
  );
}

export default async function ManifestStrip() {
  const entries = await getManifest();

  // Nothing listed yet. A ticker scrolling an empty bar reads as a broken
  // marquee; the absence of the strip reads as nothing at all, which is
  // correct — there is no manifest to run.
  if (entries.length === 0) return null;

  return (
    <div
      // Decorative duplicate of information available in full on /shop, and
      // it scrolls out of reach — announcing it would be noise.
      aria-hidden="true"
      className="overflow-hidden border-y border-hairline bg-charcoal py-4"
    >
      {/* Two identical halves, translated -50% — the seam lands off-screen. */}
      <div className="manifest-track flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {entries.map((product) => (
              <Entry
                key={`${copy}-${product.id}`}
                lot={product.lotCode}
                item={product.title.split("—")[0].trim().toUpperCase()}
                qty={product.quantityRemaining}
                closed={product.status === "CLOSED"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
