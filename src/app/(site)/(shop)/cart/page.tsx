"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { formatMoney } from "@/lib/shopify/format";

/**
 * The bag.
 *
 * Functional areas get the EOS surface and nothing more. A visitor here has
 * decided; the job is to show them exactly what they have, what it costs,
 * and how to finish — not to sell to them again. So: no upsells, no
 * "you might also like", no shipping-threshold meter.
 */
export default function CartPage() {
  const { lines, subtotal, currencyCode, updateQuantity, removeLine, isHydrated } =
    useCart();

  if (isHydrated && lines.length === 0) {
    return (
      <section className="px-6 py-28 sm:px-10 sm:py-40">
        <div className="mx-auto max-w-[1600px]">
          <p className="eos-meta-sm text-taupe">Bag</p>
          <h1 className="eos-display mt-6 max-w-[24ch] text-[2.2rem] text-bone sm:text-[3.4rem]">
            Nothing reserved yet.
          </h1>
          <p className="eos-body mt-6 max-w-md">
            Pieces you add stay in your bag across visits. Nothing is held in
            your size until checkout — on lots this small, that matters.
          </p>
          <Link href="/shop" className="eos-btn eos-btn-primary mt-10">
            Open the Manifest
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1100px]">
        <p className="eos-meta-sm text-taupe">Bag</p>
        <h1 className="eos-display mt-5 text-[2rem] text-bone sm:text-[2.8rem]">
          Reserved for you.
        </h1>

        <ul className="mt-12 border-t border-hairline">
          {lines.map((line) => (
            <li
              key={line.variantId}
              className="flex flex-wrap items-center gap-5 border-b border-hairline py-6 sm:flex-nowrap"
            >
              <div
                className={`eos-grain relative h-28 w-[5.25rem] shrink-0 overflow-hidden border border-hairline bg-gradient-to-b ${line.tone}`}
                aria-hidden="true"
              >
                {line.image && (
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes="84px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${line.productHandle}`}
                  className="eos-display-sm text-[1.15rem] text-bone transition-opacity duration-300 hover:opacity-70"
                >
                  {line.productTitle}
                </Link>
                <p className="eos-meta-sm mt-2 text-taupe">
                  {line.lotCode}
                  <span className="mx-2 text-hairline-strong">/</span>
                  Size {line.variantTitle}
                </p>
                <p className="eos-meta-sm mt-1.5 text-bone">
                  {formatMoney(line.price)}
                </p>
              </div>

              <div className="flex items-center border border-hairline">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${line.productTitle}`}
                  onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                  className="px-3 py-2 font-mono text-sm text-taupe transition-colors duration-300 hover:bg-charcoal hover:text-bone"
                >
                  −
                </button>
                <span className="eos-meta-sm w-8 text-center tabular-nums text-bone">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${line.productTitle}`}
                  onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                  className="px-3 py-2 font-mono text-sm text-taupe transition-colors duration-300 hover:bg-charcoal hover:text-bone"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeLine(line.variantId)}
                aria-label={`Remove ${line.productTitle}`}
                className="eos-meta-sm text-taupe underline-offset-4 transition-colors duration-300 hover:text-bone hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-end gap-5">
          <div className="eos-meta flex w-full max-w-sm items-baseline justify-between">
            <span className="text-taupe">Subtotal</span>
            <span className="tabular-nums text-bone">
              {formatMoney({ amount: subtotal.toFixed(2), currencyCode })}
            </span>
          </div>

          {/*
            Deliberately disabled rather than hidden. Checkout is Shopify's,
            and it is not connected yet — a button that pretends otherwise
            would be the one genuinely dishonest thing on the site.
          */}
          <button
            type="button"
            disabled
            className="eos-btn eos-btn-primary w-full max-w-sm"
          >
            Checkout — Not Yet Connected
          </button>
          <p className="eos-meta-sm max-w-sm text-right text-taupe">
            Payment and fulfilment move to Shopify at Milestone 3.
          </p>
        </div>
      </div>
    </section>
  );
}
