import { formatMoney } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";
import { FALLBACK_LOT, type Lot } from "./tokens";

/**
 * Catalog product → the lot Prototype B presents.
 *
 * The point of this file is that B stops having opinions about inventory.
 * It reads the products the storefront reads, so a piece selling closes the
 * lot in both places at once, and the price is whatever Shopify holds rather
 * than a string somebody typed months ago.
 *
 * Specs are looked up by label rather than by position. The spec list is
 * deliberately shaped per garment — a hoodie states a GSM, a suit states its
 * canvas — so a lot that does not carry a given row shows a dash there
 * instead of shifting every other row up by one.
 */
export function lotFromProduct(product: Product | undefined): Lot {
  if (!product) return FALLBACK_LOT;

  const spec = (label: string) =>
    product.specs.find((s) => s.label.toLowerCase() === label.toLowerCase())
      ?.value ?? "—";

  const weight = spec("Weight");

  return {
    code: product.lotCode,
    name: product.title,
    remaining: product.quantityRemaining,
    total: product.lotTotal ?? null,
    price: formatMoney(product.priceRange.min),
    composition: spec("Composition"),
    // Knitwear states a gauge where wovens state a weight. Either fills the
    // same row rather than leaving it blank.
    weight: weight !== "—" ? weight : spec("Gauge"),
    fit: spec("Fit"),
    construction: spec("Construction"),
    origin: spec("Origin"),
    sizes: product.options.find((o) => o.name === "Size")?.values ?? [],
  };
}
