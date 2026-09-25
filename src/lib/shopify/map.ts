import { nodes } from "./client";
import { METAFIELDS, METAFIELD_NAMESPACE } from "./config";
import type { GqlCollection, GqlMetafield, GqlProduct } from "./queries";
import type {
  Collection,
  Product,
  ProductSpec,
  ProductStatus,
  ProductVariant,
} from "./types";

/**
 * Shopify's product → the EOS lot.
 *
 * Three kinds of field pass through here, and they behave differently:
 *
 *   VERBATIM   title, description, price, variants, options, images.
 *              Shopify owns these outright.
 *
 *   DERIVED    status and quantityRemaining. Nobody types these anywhere;
 *              they fall out of inventory. Selling the last piece closes the
 *              lot with no human involved, which is the only way the
 *              scarcity on this site stays true.
 *
 *   EOS-OWNED  lotCode, specs, the GLB. Production data that has nothing to
 *              do with commerce and lives in metafields. All optional — a
 *              product added in Shopify with none of them still renders.
 */

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Stable 32-bit hash. Used only to derive presentation fallbacks. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Tone plates, for products with no photography yet.
 *
 * Picked by hash so a given product always gets the same plate: a card that
 * changed colour between two renders of the same grid would read as a bug.
 * These disappear per-product the moment an image is uploaded in Shopify.
 */
const TONES = [
  "from-[#221e1c] to-[#0a0909]",
  "from-[#1c1a16] to-[#0a0909]",
  "from-[#191614] to-[#0a0909]",
  "from-[#181a1d] to-[#0a0909]",
  "from-[#17191a] to-[#0a0909]",
  "from-[#1a1815] to-[#0a0909]",
] as const;

function toneFor(handle: string): string {
  return TONES[hash(handle) % TONES.length];
}

function metafield(fields: GqlMetafield[], key: string): string | undefined {
  const found = fields?.find(
    (f) => f && f.namespace === METAFIELD_NAMESPACE && f.key === key,
  );
  return found?.value || undefined;
}

/**
 * Lot code, in descending order of trustworthiness.
 *
 * A code is on screen everywhere — cards, the ticker, the product record —
 * so there has to be one. Preference goes to the metafield, then to a SKU
 * that already looks like a lot code, and only then to a derived code. The
 * derived form is deterministic so it never changes under a product, but it
 * is a placeholder: a real manifest wants the metafield set.
 */
function lotCodeFor(product: GqlProduct, variants: ProductVariant[]): string {
  const declared = metafield(product.metafields, METAFIELDS.lotCode);
  if (declared) return declared;

  /**
   * A SKU is only a lot code when it is shaped like one.
   *
   * This used to accept any SKU beginning "EOS-" and take its first two
   * dash-separated segments. That was written for codes like EOS-014-7. The
   * store's SKUs are descriptive instead — EOS-SW-HEATHER-GREY-EMBELLISHED-S
   * — where the first two segments are the *category*, so 58 products
   * collapsed onto three codes: EOS-SW appeared on 28 of them, EOS-BT on 17,
   * EOS-HD on 13. A lot code that is not unique is worse than no lot code,
   * because the whole manifest conceit is that it identifies one lot.
   *
   * So the SKU is used only when it is EOS- followed by digits, which is a
   * deliberate identifier rather than a naming convention. Anything else
   * falls through to the derived code below.
   */
  const sku = variants.find((v) => v.sku)?.sku;
  const codeLike = sku?.match(/^EOS-(\d{1,4})(?:[-_.](\d{1,2}))?/i);
  if (codeLike) {
    const [, digits, suffix] = codeLike;
    return `EOS-${digits.padStart(3, "0")}${suffix ? `.${suffix}` : ""}`;
  }

  const n = hash(product.handle) % 1000;
  const suffix = hash(product.handle + "s") % 10;
  return `EOS-${String(n).padStart(3, "0")}.${suffix}`;
}

/** Construction manifest. Stored as JSON so garments can differ in shape. */
function specsFor(product: GqlProduct): ProductSpec[] {
  const raw = metafield(product.metafields, METAFIELDS.specs);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && typeof s.label === "string" && typeof s.value === "string")
      .map((s) => ({ label: s.label, value: s.value }));
  } catch {
    // A malformed metafield is a content problem, not a reason to fail the
    // page — the specification table simply does not render.
    return [];
  }
}

/** Original lot size. Absent, or non-numeric, both mean "unknown". */
function lotTotalFor(product: GqlProduct): number | null {
  const raw = metafield(product.metafields, METAFIELDS.lotSize);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function garmentAssetFrom(product: GqlProduct): string | null {
  return metafield(product.metafields, METAFIELDS.garment) ?? null;
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

export function mapProduct(product: GqlProduct): Product {
  const variants: ProductVariant[] = nodes(product.variants).map((v) => ({
    id: v.id,
    title: v.title,
    sku: v.sku ?? "",
    price: v.price,
    availableForSale: v.availableForSale,
    // Null means Shopify would not tell us — see the note in queries.ts.
    quantityAvailable: v.quantityAvailable ?? 0,
    selectedOptions: v.selectedOptions,
  }));

  const status: ProductStatus = variants.some((v) => v.availableForSale)
    ? "OPEN"
    : "CLOSED";

  /**
   * Remaining count, or null when Shopify withheld it.
   *
   * Null is not zero and must not be rendered as a number. Without the
   * inventory scope every variant returns null, and printing "00 REMAINING"
   * for a lot that is actually in stock would be worse than printing
   * nothing — so the UI says "Available" instead and the count is simply
   * absent until the scope is granted.
   */
  const tracked = nodes(product.variants).filter(
    (v) => typeof v.quantityAvailable === "number",
  );
  const quantityRemaining =
    tracked.length === 0
      ? status === "CLOSED"
        ? 0
        : null
      : tracked.reduce((sum, v) => sum + (v.quantityAvailable ?? 0), 0);

  const images = nodes(product.images);
  const tone = toneFor(product.handle);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    lotCode: lotCodeFor(product, variants),
    status,
    quantityRemaining,
    collectionHandles: nodes(product.collections).map((c) => c.handle),
    garmentAsset: garmentAssetFrom(product),
    lotTotal: lotTotalFor(product),
    specs: specsFor(product),
    images:
      images.length > 0
        ? images.map((image, i) => ({
            id: image.id ?? `${product.handle}-${i}`,
            altText: image.altText ?? product.title,
            url: image.url,
            width: image.width ?? null,
            height: image.height ?? null,
            tone,
          }))
        : // No photography yet: one tone plate so the card still composes.
          [
            {
              id: `${product.handle}-plate`,
              altText: product.title,
              url: null,
              width: null,
              height: null,
              tone,
            },
          ],
    options: product.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.values,
    })),
    variants,
    priceRange: {
      min: product.priceRange.minVariantPrice,
      max: product.priceRange.maxVariantPrice,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

/**
 * @param products every mapped product, so a collection's status can be
 *   derived from its members. Shopify has no notion of a closed collection;
 *   it is closed when nothing in it can be bought.
 */
export function mapCollection(
  collection: GqlCollection,
  products: Product[],
): Collection {
  const members = products.filter((p) =>
    p.collectionHandles.includes(collection.handle),
  );

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    tone: toneFor(collection.handle),
    status: members.some((p) => p.status === "OPEN") ? "OPEN" : "CLOSED",
  };
}
