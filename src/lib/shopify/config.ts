/**
 * Every store-specific decision, in one file.
 *
 * The point of collecting these is that none of them can be known before the
 * real store exists. Metafield namespaces and keys are chosen by whoever
 * configures Shopify; the hero product's handle depends on what is actually
 * listed. Scattering guesses through a mapper would mean hunting them down
 * later, so they are named here once and read from the environment.
 *
 * ENVIRONMENT
 *   EOS_CATALOG_SOURCE            "placeholder" (default) | "shopify"
 *   SHOPIFY_STOREFRONT_ENDPOINT   GraphQL URL
 *   SHOPIFY_STOREFRONT_TOKEN      public Storefront access token
 *   SHOPIFY_STOREFRONT_VERSION    API version, e.g. 2025-07
 *   EOS_HERO_HANDLE               product the homepage opens on
 *   EOS_METAFIELD_NAMESPACE       namespace holding the EOS-owned fields
 *   SHOPIFY_REVALIDATE_SECRET     shared secret for the webhook route
 *
 * Nothing here activates anything. With no environment set the site runs on
 * placeholder data exactly as before.
 */

export type CatalogSource = "placeholder" | "shopify";

export function catalogSource(): CatalogSource {
  return process.env.EOS_CATALOG_SOURCE === "shopify" ? "shopify" : "placeholder";
}

/**
 * Shopify's public mock Storefront API.
 *
 * Credential-free and shaped exactly like the real thing — real `gid://`
 * ids, the edges/nodes wrapping, and genuine `quantityAvailable` values. It
 * is the default endpoint so the Shopify path can be developed and reviewed
 * before any store exists. It serves no metafields, which is precisely why
 * the mapper treats every EOS-owned field as optional.
 */
export const MOCK_ENDPOINT = "https://mock.shop/api";

export function storefrontEndpoint(): string {
  return process.env.SHOPIFY_STOREFRONT_ENDPOINT || MOCK_ENDPOINT;
}

export function storefrontToken(): string | undefined {
  return process.env.SHOPIFY_STOREFRONT_TOKEN || undefined;
}

export function heroHandle(): string {
  return process.env.EOS_HERO_HANDLE || "heavyweight-hoodie";
}

/**
 * The EOS-owned fields, as Shopify metafields.
 *
 * Shopify owns the product. It does not own the *lot* — the code, the
 * construction manifest, the GLB. Those are EOS production data that happen
 * to live alongside the product, so they are metafields, and their
 * identifiers are the single most likely thing to differ from these guesses.
 * Change them here and the whole mapper follows.
 */
export const METAFIELD_NAMESPACE = process.env.EOS_METAFIELD_NAMESPACE || "eos";

export const METAFIELDS = {
  /** e.g. "EOS-014.7" */
  lotCode: "lot_code",
  /**
   * Original size of the lot, as an integer.
   *
   * The one genuinely un-derivable number on this site. Shopify knows the
   * eight jackets left; only EOS knows there were fourteen.
   */
  lotSize: "lot_size",
  /**
   * Construction manifest, as a JSON array of {label, value}.
   *
   * A list rather than one metafield per spec: garments do not agree on
   * which properties matter — a hoodie has a GSM, a suit has a canvas, a
   * pair of jeans has a wash — and a fixed set of fields would either be
   * mostly empty or keep needing new ones defined in the Shopify admin.
   */
  specs: "specs",
  /**
   * Path to a GLB under /public, e.g. "/garments/hoodie-014.glb".
   *
   * Optional, and absent for most products by design: without it the
   * garment system falls back to its procedural piece, so a product added
   * in Shopify gets a credible hero with no code change at all.
   */
  garment: "garment_asset",
} as const;

export function metafieldIdentifiers() {
  return Object.values(METAFIELDS).map((key) => ({
    namespace: METAFIELD_NAMESPACE,
    key,
  }));
}

/* ------------------------------------------------------------------ */
/* Caching                                                             */
/* ------------------------------------------------------------------ */

/**
 * Cache tag every catalog request carries.
 *
 * The webhook route invalidates this one tag, which drops the whole
 * catalog at once. Finer-grained tags would save a little revalidation
 * work and cost correctness: a single product selling out changes the
 * collection totals, the manifest ticker and the homepage's open-lot list,
 * so a "just this product" invalidation would leave three other surfaces
 * quietly stale.
 */
export const CATALOG_TAG = "eos-catalog";

/**
 * Fallback refresh interval, in seconds.
 *
 * The webhook is the real mechanism — this is what keeps the site roughly
 * honest if the webhook is never configured, is misconfigured, or silently
 * stops firing. On a site whose entire premise is that the counts are real,
 * a stale `04 REMAINING` is the worst thing on the page, so the floor is
 * deliberately short rather than a comfortable hour.
 */
export const CATALOG_REVALIDATE_SECONDS = Number(
  process.env.EOS_CATALOG_REVALIDATE || 60,
);
