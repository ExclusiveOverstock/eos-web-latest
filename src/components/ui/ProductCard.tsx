"use client";

import Image from "next/image";
import { shopifyImageLoader } from "@/lib/shopify/image-loader";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/shopify/types";
import { formatMoney } from "@/lib/shopify/format";
import LotStatus from "./LotStatus";

/**
 * A lot card.
 *
 * Four things only: the piece, its name, its price and what is left of it.
 * There is no quick-add button — on a site where every lot is a handful of
 * pieces, adding one to a bag from a grid without ever seeing it is the
 * wrong transaction to make easy, and a row of buttons is the fastest way
 * to make a page look like a marketplace.
 *
 * The image well handles both worlds. A product with photography in Shopify
 * shows it, and hovering cross-fades to the second shot. A product without
 * any yet falls back to its tone plate, framed and grained so it reads as a
 * deliberate surface rather than as a missing image. Both states are
 * expected: EOS lists lots before it shoots them.
 */
export default function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);

  /**
   * Store order, untouched.
   *
   * An earlier version sorted portrait images to the front on the theory
   * that a tall well wants a tall photograph. That was backwards for this
   * catalog: EOS's 6000x4000 landscape frame is the hero — the whole garment,
   * squared to the camera on a sweep — and the 4000x6000 portrait is a
   * secondary angled detail. Sorting by shape promoted the detail shot over
   * the hero on twenty-one products. Shopify's own ordering already puts the
   * hero first, so it is trusted.
   */
  const primary = product.images[0];
  const alternate = product.images[1] ?? primary;
  const image = hovered ? alternate : primary;
  const closed = product.status === "CLOSED";

  return (
    <Link
      href={`/products/${product.handle}`}
      data-cursor="discover"
      data-cursor-label={closed ? "Closed" : "View"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group flex h-full flex-col bg-void transition-colors duration-500 hover:bg-charcoal"
    >
      <div
        /*
          3:4, matching the photography as it now stands.

          This frame has been wrong twice, in opposite directions, and the
          reason both times was the same: it has to match whatever shape the
          store's first image actually is.

          It began as 3:4 by assumption, which cropped the landscape flat lays
          then in the catalog by half. It was corrected to 3:2 to match them.
          The catalog was then reshot as full-body portraits — 57 of 58
          products now lead with one — and 3:2 cut the model's head and legs
          off. It is 3:4 again, this time by measurement: the new frames
          cluster at a 0.74 ratio, and 3:4 is 0.75.

          If the grid ever starts cutting garments again, check the first
          image's orientation in Shopify before touching anything here.
        */
        className={`eos-grain relative aspect-[3/4] overflow-hidden bg-gradient-to-b ${image?.tone ?? ""}`}
      >
        {primary?.url && (
          <>
            {/*
              Both frames are mounted and cross-faded on opacity rather than
              swapping one `src`. Swapping the source makes the browser fetch
              the second image on first hover, so the card flashes empty for
              a beat at exactly the moment someone is looking at it.
            */}
            <Image
              src={primary.url}
              alt={primary.altText}
              fill
              loader={shopifyImageLoader}
              sizes="(min-width: 640px) 25vw, 50vw"
              className={`object-contain transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                hovered && alternate !== primary ? "opacity-0" : "opacity-100"
              }`}
            />
            {alternate !== primary && alternate?.url && (
              <Image
                src={alternate.url}
                alt={alternate.altText}
                fill
                loader={shopifyImageLoader}
                sizes="(min-width: 640px) 25vw, 50vw"
                className={`object-contain transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  hovered ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            {/* Keeps the lot code and count legible over any photograph. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-void/40"
            />
          </>
        )}

        {/*
          A single hairline frame inset from the edge. It is the one piece of
          decoration on the card and it does real work: it gives the well an
          intentional boundary, so a bare tone plate reads as a plate rather
          than as a missing image.
        */}
        <span
          aria-hidden="true"
          className="absolute inset-2 border border-hairline transition-colors duration-700 group-hover:border-hairline-strong lg:inset-4"
        />

        <span className="eos-meta-sm absolute left-4 top-4 text-taupe lg:left-7 lg:top-7">
          {product.lotCode}
        </span>

        <span className="absolute bottom-4 left-4 lg:bottom-7 lg:left-7">
          <LotStatus status={product.status} quantity={product.quantityRemaining} />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3 lg:gap-4 lg:p-6">
        <h3 className="eos-display-sm text-[0.9rem] text-bone lg:text-[1.2rem]">
          {product.title}
        </h3>
        <p className="eos-meta-sm text-taupe">
          {formatMoney(product.priceRange.min)}
        </p>
      </div>
    </Link>
  );
}
