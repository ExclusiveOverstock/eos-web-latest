import Link from "next/link";
import { pad2 } from "@/lib/shopify/format";
import { getAllCollections, getProductsByCollection } from "@/lib/shopify/catalog";

/**
 * Collections, as an index rather than a grid.
 *
 * There is no product photography yet, and there is a strong temptation to
 * fill the gap with four identical gradient tiles. Four identical gradient
 * tiles look like a template waiting for images. An index does not: a ruled
 * list of lots, numbered, with the count of what is left, is how an archive
 * actually presents itself, and it will still be the right layout once real
 * imagery exists — the image just becomes the thing that fills the row on
 * hover.
 *
 * Each row is a full-width target, which is also the most usable thing to
 * put in front of a thumb.
 */
export default async function CollectionIndex() {
  const all = await getAllCollections();
  const collections = await Promise.all(
    all.map(async (collection) => {
      const products = await getProductsByCollection(collection.handle);
      const counted = products.every((p) => p.quantityRemaining !== null);
      return {
        ...collection,
        // Null when any member's count is unknown — see LotStatus. A partial
        // sum would be a smaller number presented as a complete one.
        pieces: counted
          ? products.reduce((sum, p) => sum + (p.quantityRemaining ?? 0), 0)
          : null,
        lots: products.length,
      };
    }),
  );

  // No collections published yet. A bare ruled line with nothing under it
  // looks like a layout that failed; a sentence looks like a shop that has
  // not opened.
  if (collections.length === 0) {
    return (
      <p className="eos-body border-t border-hairline pt-10 max-w-md">
        No collections yet. They appear as lots are acquired and grouped.
      </p>
    );
  }

  return (
    <ul className="border-t border-hairline">
      {collections.map((collection, i) => (
        <li key={collection.handle}>
          <Link
            href={`/collections/${collection.handle}`}
            data-cursor="discover"
            data-cursor-label="Open"
            className="group relative flex items-baseline gap-5 border-b border-hairline py-8 transition-colors duration-500 hover:border-hairline-strong sm:gap-10 sm:py-11"
          >
            {/*
              The tone panel is the only place product colour appears in the
              index, and it only appears on approach — the list stays quiet
              until the visitor shows interest in a specific lot.
            */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute inset-x-0 inset-y-px -z-10 bg-gradient-to-r opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 ${collection.tone}`}
            />

            <span className="eos-meta-sm w-8 shrink-0 tabular-nums text-hairline-strong transition-colors duration-500 group-hover:text-taupe">
              {pad2(i + 1)}
            </span>

            <span className="flex-1">
              <span className="eos-display-sm block text-[1.7rem] text-bone transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 sm:text-[2.6rem]">
                {collection.title}
              </span>
              <span className="eos-body mt-2 block max-w-[46ch] text-[13px] sm:text-sm">
                {collection.description}
              </span>
            </span>

            <span className="eos-meta-sm shrink-0 text-right">
              {collection.status === "OPEN" ? (
                collection.pieces === null ? (
                  <span className="text-bone">Available</span>
                ) : (
                  <span className="tabular-nums text-bone">
                    {pad2(collection.pieces)}
                    <span className="ml-2 text-taupe">Remaining</span>
                  </span>
                )
              ) : (
                <span className="flex items-center justify-end gap-2 text-taupe">
                  <span aria-hidden="true" className="h-1 w-1 bg-oxblood" />
                  Closed
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
