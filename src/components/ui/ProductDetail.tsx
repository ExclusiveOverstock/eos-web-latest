import Link from "next/link";
import ProductGallery from "./ProductGallery";
import AddToBag from "./AddToBag";
import LotStatus from "./LotStatus";
import { formatMoney } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";

/**
 * The product page.
 *
 * The practical counterpart to the lot experience: everything a buyer needs,
 * on one screen, in the order they need it.
 *
 * WHAT USED TO BE HERE, AND WHY IT IS NOT.
 *
 * This slot held an interactive 3D garment — the whole image column was a
 * canvas. With one real captured GLB and twenty-five products, that meant
 * almost every page showed a *procedural approximation* of the piece: right
 * silhouette, invented everything else. The page rendered zero photographs.
 * A visitor who picked a product out of the grid by its photograph arrived
 * at a page that did not contain it.
 *
 * That is indefensible on a storefront, and doubly so on this one, whose
 * entire argument is that the garment already physically exists. Showing a
 * synthesised stand-in for a real object is the one lie the brand cannot
 * afford. So the column is the photography now — see ProductGallery, which
 * also explains why it is a slideshow rather than the vertical stack that
 * replaced the canvas first.
 *
 * There is no longer a link out to a 3D "lot experience". That route showed
 * a procedurally generated garment standing in for the real product, which
 * is the same thing this page stopped doing when the canvas came out of the
 * image column. Keeping a prominent button to it would have pointed people
 * at the one remaining synthesised garment on the site.
 */
export default function ProductDetail({ product }: { product: Product }) {
  const closed = product.status === "CLOSED";

  return (
    <article>
      <section className="px-6 pt-10 sm:px-10 sm:pt-14">
        <div className="mx-auto max-w-[1600px]">
          <Link
            href="/shop"
            className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
          >
            ← The Manifest
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            {/* --- The piece ------------------------------------- */}
            <div>
              <ProductGallery images={product.images} title={product.title} />

            </div>

            {/* --- The record ------------------------------------ */}
            {/*
              Sticky on desktop. With the images stacked the left column is
              now several screens tall, and a price and size selector that
              scrolled away with the first photograph would make the page
              harder to buy from than the version it replaced.
            */}
            <div className="lg:sticky lg:top-24 lg:self-start lg:pt-4">
              <p className="eos-meta-sm text-taupe">
                {product.lotCode}
                <span className="mx-3 text-hairline-strong">/</span>
                {closed ? "Closed Lot" : "Open Lot"}
              </p>

              <h1 className="eos-display mt-5 max-w-[24ch] text-[2rem] text-bone sm:text-[2.8rem]">
                {product.title}
              </h1>

              <p className="eos-meta mt-6 text-bone">
                {formatMoney(product.priceRange.min)}
              </p>

              <div className="mt-9 border-y border-hairline py-7">
                <LotStatus status={product.status} size="lg" />
              </div>

              <AddToBag product={product} />

              <p className="eos-body mt-12 max-w-prose">{product.description}</p>

              {/*
                Specification as a manifest. A garment that is worth buying
                because of what it is made of should state what it is made of
                in the same register the lot codes are set in.
              */}
              <dl className="mt-12 border-t border-hairline">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-8 border-b border-hairline py-4"
                  >
                    <dt className="eos-meta-sm text-taupe">{spec.label}</dt>
                    <dd className="eos-meta-sm text-right text-bone">
                      {spec.value}
                    </dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-8 border-b border-hairline py-4">
                  <dt className="eos-meta-sm text-taupe">Lot</dt>
                  <dd className="eos-meta-sm text-right text-bone">
                    {product.lotCode}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="h-24 sm:h-32" />
    </article>
  );
}
