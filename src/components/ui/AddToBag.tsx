"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import type { Product } from "@/lib/shopify/types";

/**
 * Size selection and the one commercial action on the site.
 *
 * Shared by the product page and the lot experience so the two can never
 * drift — a size grid that behaves differently depending on which route you
 * reached it from is the kind of inconsistency that quietly costs trust at
 * the exact moment it matters most.
 *
 * Unavailable sizes stay visible and struck through rather than being
 * removed. On lots this small, "the M has gone" is information, not an
 * error state to hide.
 */
export default function AddToBag({
  product,
  layout = "block",
}: {
  product: Product;
  /** `inline` is the compact form used inside the pinned lot experience. */
  layout?: "block" | "inline";
}) {
  const { addLine } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const sizeOption = product.options.find((o) => o.name === "Size");
  const allSoldOut = product.variants.every((v) => !v.availableForSale);

  const variantForSize = useMemo(
    () => (size: string) =>
      product.variants.find((v) =>
        v.selectedOptions.some((o) => o.name === "Size" && o.value === size),
      ),
    [product.variants],
  );

  const selectedVariant = selectedSize ? variantForSize(selectedSize) : undefined;

  function handleAdd() {
    if (!selectedVariant?.availableForSale) return;
    addLine(
      {
        variantId: selectedVariant.id,
        productHandle: product.handle,
        productTitle: product.title,
        variantTitle: selectedVariant.title,
        lotCode: product.lotCode,
        price: selectedVariant.price,
        image: product.images[0]?.url ?? null,
        tone: product.images[0]?.tone ?? "from-[#1a1a1a] to-[#0a0909]",
      },
      1,
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  if (allSoldOut) {
    return (
      <div className={layout === "inline" ? "" : "mt-10"}>
        <button type="button" disabled className="eos-btn w-full sm:w-auto sm:min-w-[300px]">
          Lot Closed
        </button>
        <p className="eos-meta-sm mt-4 text-taupe">
          This piece will not return.
        </p>
      </div>
    );
  }

  return (
    <div className={layout === "inline" ? "" : "mt-10"}>
      {sizeOption && (
        <fieldset>
          <legend className="eos-meta-sm text-hairline-strong">Size</legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {sizeOption.values.map((size) => {
              const variant = variantForSize(size);
              const unavailable = !variant?.availableForSale;
              const active = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={active}
                  onClick={() => setSelectedSize(size)}
                  className={`eos-meta-sm min-w-[3.25rem] border px-3.5 py-2.5 transition-colors duration-300 ${
                    unavailable
                      ? "cursor-not-allowed border-hairline text-hairline-strong line-through"
                      : active
                        ? "border-oxblood bg-oxblood text-bone"
                        : "border-hairline-strong text-bone hover:border-bone"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedVariant}
        className={`eos-btn mt-6 w-full sm:w-auto sm:min-w-[300px] ${
          selectedVariant ? "eos-btn-primary" : ""
        }`}
      >
        {added ? "Added to Bag" : selectedVariant ? "Add to Bag" : "Select a Size"}
      </button>

      {/* Announced politely so the confirmation reaches a screen reader
          without stealing focus from the size grid. */}
      <p aria-live="polite" className="sr-only">
        {added ? `${product.title} added to your bag` : ""}
      </p>
    </div>
  );
}
