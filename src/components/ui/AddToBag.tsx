"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import type { Product, ProductVariant } from "@/lib/shopify/types";

/**
 * Option selection and the one commercial action on the site.
 *
 * WHAT THIS USED TO GET WRONG.
 *
 * It assumed every product is sized. It looked for an option literally named
 * "Size", rendered a grid from it, and kept the button disabled until
 * something in that grid was clicked. Against the real catalog that meant 55
 * of 58 products could never be added to the bag: the button sat there
 * reading "Select a Size" with no sizes to select, because 51 products carry
 * no options at all and 4 are sold by colour.
 *
 * So nothing is hardcoded now. The component reads whatever options the
 * product actually has and requires one choice per option. A product with no
 * options is immediately buyable, which is the common case here.
 *
 * Unavailable values stay visible and struck through rather than being
 * removed. On lots this small, "the M has gone" is information, not an error
 * state to hide.
 */

/**
 * Shopify gives every product a synthetic option when the merchant defined
 * none: one option named "Title" whose only value is "Default Title". It is
 * an implementation detail of their data model, not a choice a customer
 * should ever be shown, so it is filtered out here — and filtering it out is
 * precisely what makes a single-variant product buyable in one click.
 */
function isSyntheticOption(option: { name: string; values: string[] }) {
  return (
    option.name === "Title" &&
    option.values.length === 1 &&
    option.values[0] === "Default Title"
  );
}

export default function AddToBag({
  product,
  layout = "block",
}: {
  product: Product;
  /** `inline` is a compact form for tighter columns. */
  layout?: "block" | "inline";
}) {
  const { addLine } = useCart();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const options = useMemo(
    () => product.options.filter((o) => !isSyntheticOption(o)),
    [product.options],
  );

  const allSoldOut = product.variants.every((v) => !v.availableForSale);

  /**
   * The variant the current choices identify, if they identify one.
   *
   * With no real options there is exactly one variant and it is selected
   * from the outset. Otherwise every option has to be answered before a
   * variant can be named, and matching is done on the real options only —
   * comparing every `selectedOption` would fail on the synthetic "Title"
   * that the customer was never asked about.
   */
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (options.length === 0) return product.variants[0];
    if (options.some((o) => !chosen[o.name])) return undefined;
    return product.variants.find((v) =>
      options.every((o) =>
        v.selectedOptions.some(
          (s) => s.name === o.name && s.value === chosen[o.name],
        ),
      ),
    );
  }, [options, chosen, product.variants]);

  /** Is any purchasable variant carrying this value for this option? */
  function valueAvailable(optionName: string, value: string) {
    return product.variants.some(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.some((s) => s.name === optionName && s.value === value),
    );
  }

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
        <p className="eos-meta-sm mt-4 text-taupe">This piece will not return.</p>
      </div>
    );
  }

  // Names the thing still missing, so the button says "Select a Size" on a
  // sized piece and "Select a Colour" on one sold by colour, rather than
  // asking for a size that does not exist.
  const missing = options.find((o) => !chosen[o.name]);

  return (
    <div className={layout === "inline" ? "" : "mt-10"}>
      {options.map((option) => (
        <fieldset key={option.name} className="mt-6 first:mt-0">
          <legend className="eos-meta-sm text-hairline-strong">{option.name}</legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {option.values.map((value) => {
              const unavailable = !valueAvailable(option.name, value);
              const active = chosen[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={active}
                  onClick={() =>
                    setChosen((prev) => ({ ...prev, [option.name]: value }))
                  }
                  className={`eos-meta-sm min-w-[3.25rem] border px-3.5 py-2.5 transition-colors duration-300 ${
                    unavailable
                      ? "cursor-not-allowed border-hairline text-hairline-strong line-through"
                      : active
                        ? "border-oxblood bg-oxblood text-bone"
                        : "border-hairline-strong text-bone hover:border-bone"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!selectedVariant?.availableForSale}
        className={`eos-btn mt-6 w-full sm:w-auto sm:min-w-[300px] ${
          selectedVariant?.availableForSale ? "eos-btn-primary" : ""
        }`}
      >
        {added
          ? "Added to Bag"
          : missing
            ? `Select a ${missing.name}`
            : selectedVariant?.availableForSale
              ? "Add to Bag"
              : "Unavailable"}
      </button>

      {/* Announced politely so the confirmation reaches a screen reader
          without stealing focus from the option grid. */}
      <p aria-live="polite" className="sr-only">
        {added ? `${product.title} added to your bag` : ""}
      </p>
    </div>
  );
}
