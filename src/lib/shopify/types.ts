/**
 * These types deliberately mirror the shape of Shopify's Storefront API
 * (Product, ProductVariant, Money, etc.) so that placeholder-data.ts can be
 * swapped for a real `lib/shopify/client.ts` fetch layer in Milestone 3
 * without touching any component that consumes this data.
 *
 * A few EOS-specific fields (lotCode, quantityRemaining, status) are not
 * part of Shopify's schema — in Milestone 3 these will come from Shopify
 * metafields on the product, but are modeled directly here for now.
 */

export type Money = {
  amount: string;
  currencyCode: string;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  sku: string;
  price: Money;
  availableForSale: boolean;
  quantityAvailable: number;
  selectedOptions: SelectedOption[];
};

/**
 * A product image.
 *
 * Carries both a real Shopify CDN URL and a gradient plate, because a lot
 * can be listed before it has been shot. Whichever surface renders it picks
 * the URL when there is one and the plate when there is not.
 */
export type ProductImage = {
  id: string;
  altText: string;
  /**
   * Shopify CDN URL, or null when the product has no photography yet.
   *
   * Null is expected rather than exceptional: a lot can be listed before it
   * is shot. Consumers fall back to `tone`, which is why both fields exist
   * and why neither is optional.
   */
  url: string | null;
  /**
   * Pixel dimensions, or null for a tone plate (which has no file).
   *
   * Carried so a consumer can tell a landscape shot from a portrait one.
   * EOS's photography is mixed — the same product has a 6000x4000 flat lay
   * and a 4000x6000 on-body frame — and a component that assumes one
   * orientation crops the other in half.
   */
  width: number | null;
  height: number | null;
  /** Gradient plate shown when there is no image. */
  tone: string;
};

export type ProductStatus = "OPEN" | "CLOSED";

/**
 * Construction detail — weight, composition, fit, finishing.
 *
 * Rendered as a manifest rather than as prose, which is how a serious
 * garment states its own specification. In Milestone 3 these come from
 * Shopify metafields; the shape is a flat label/value list precisely so that
 * mapping is a one-liner.
 */
export type ProductSpec = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  lotCode: string;
  status: ProductStatus;
  /**
   * Pieces left in the lot, or null when the count is genuinely unknown.
   *
   * Shopify only returns `quantityAvailable` when inventory tracking is on
   * and the app holds the inventory scope; without it every variant comes
   * back null. Null is NOT zero — rendering it as a number would print
   * "00 REMAINING" over a lot that is in stock. Surfaces that show a count
   * must handle null by showing no count at all.
   */
  quantityRemaining: number | null;
  collectionHandles: string[];
  /**
   * Path to a GLB under /public, set from Shopify.
   *
   * Optional and usually absent. When present it overrides the local
   * registry in garment-config, which is what lets a new lot be given a real
   * 3D asset by uploading the file once and pointing at it from the Shopify
   * admin — no code change. Absent, the garment system falls back to the
   * registry and then to its procedural piece, so a lot always has a hero.
   */
  garmentAsset?: string | null;
  /**
   * How many pieces the lot held originally.
   *
   * Shopify has no such concept — it tracks what is in stock, never what was.
   * So this is EOS production data, set from a metafield, and legitimately
   * absent for most lots. Surfaces that say "four of six have gone" need it;
   * everything that only states what remains does not.
   */
  lotTotal?: number | null;
  specs: ProductSpec[];
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  priceRange: {
    min: Money;
    max: Money;
  };
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  tone: string;
  status: ProductStatus;
};

export type CartLine = {
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  lotCode: string;
  price: Money;
  /** Thumbnail URL, or null when the product has no photography. */
  image: string | null;
  /** Gradient plate, shown when `image` is null. */
  tone: string;
  quantity: number;
};
