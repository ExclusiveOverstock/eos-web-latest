import { cache } from "react";
import { storefront } from "./client";
import { catalogSource, heroHandle, metafieldIdentifiers } from "./config";
import { mapCollection, mapProduct } from "./map";
import {
  COLLECTIONS_QUERY,
  PRODUCTS_QUERY,
  type CollectionsResponse,
  type ProductsResponse,
} from "./queries";
import * as placeholder from "./placeholder-data";
import type { Collection, Product } from "./types";

/**
 * The catalog. One module, two possible sources, one set of accessors.
 *
 * Every page and component in the site reads through these functions and
 * none of them knows or cares where the data came from. Flipping
 * EOS_CATALOG_SOURCE to "shopify" changes the whole site; leaving it unset
 * runs on placeholder data exactly as before, which is what keeps the site
 * reviewable before a store exists.
 *
 * SERVER ONLY. These are async and hit the network with a token attached,
 * so a Client Component importing them would ship the whole catalog — and
 * potentially the token — to the browser. The guard below makes that a loud
 * failure rather than a silent leak. (The `server-only` package does this
 * at build time and is the better tool, but it is not a dependency here and
 * this is not worth adding one for.) The single place that needed products
 * in client state — the manifest's filters — takes them as props instead.
 *
 * WHY EVERYTHING IS ASYNC, EVEN ON PLACEHOLDER DATA
 * The placeholder path could return synchronously. It does not, because a
 * signature that changes when the source changes would push the async
 * migration into every consumer at exactly the moment Shopify is switched
 * on. Paying it once, now, against data that cannot fail is the cheap way
 * round.
 */

/**
 * How many lots to read in one pass.
 *
 * The whole catalog is fetched at once rather than page by page, because
 * almost everything on this site is derived from the complete set — a
 * collection's status, the manifest ticker, the homepage's open lots. EOS
 * lists tens of lots, not thousands; if that ever stops being true this is
 * the constant that has to become a cursor.
 */
const CATALOG_SIZE = 250;

if (typeof window !== "undefined") {
  throw new Error(
    "lib/shopify/catalog is server-only. Fetch on the server and pass the " +
      "result down as props.",
  );
}

type Catalog = { products: Product[]; collections: Collection[] };

/**
 * Loaded once per request.
 *
 * React's `cache` dedupes across the whole render pass, so a page rendering
 * the header, a product grid and the manifest ticker makes one network call
 * rather than three. Next's fetch cache handles the request-to-request case.
 */
const loadCatalog = cache(async (): Promise<Catalog> => {
  if (catalogSource() === "placeholder") {
    return {
      products: placeholder.getAllProducts(),
      collections: placeholder.getAllCollections(),
    };
  }

  const metafields = metafieldIdentifiers();

  const [productData, collectionData] = await Promise.all([
    storefront<ProductsResponse>(PRODUCTS_QUERY, {
      first: CATALOG_SIZE,
      metafields,
    }),
    storefront<CollectionsResponse>(COLLECTIONS_QUERY, { first: CATALOG_SIZE }),
  ]);

  const products = productData.products.edges.map((e) => mapProduct(e.node));

  return {
    products,
    // Collections are mapped against the products because their OPEN/CLOSED
    // state is derived from membership — Shopify has no such field.
    collections: collectionData.collections.edges.map((e) =>
      mapCollection(e.node, products),
    ),
  };
});

/* ------------------------------------------------------------------ */
/* Accessors                                                           */
/* ------------------------------------------------------------------ */

export async function getAllProducts(): Promise<Product[]> {
  return (await loadCatalog()).products;
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  return (await loadCatalog()).products.find((p) => p.handle === handle);
}

export async function getAllCollections(): Promise<Collection[]> {
  return (await loadCatalog()).collections;
}

export async function getCollectionByHandle(
  handle: string,
): Promise<Collection | undefined> {
  return (await loadCatalog()).collections.find((c) => c.handle === handle);
}

export async function getProductsByCollection(handle: string): Promise<Product[]> {
  return (await loadCatalog()).products.filter((p) =>
    p.collectionHandles.includes(handle),
  );
}

/**
 * The piece the homepage opens on.
 *
 * Falls back to the first open lot rather than throwing. A homepage that
 * 500s because one product was renamed in Shopify is a worse failure than a
 * homepage that opens on a different garment, and renaming a product is a
 * thing merchandisers do without warning.
 */
export async function getHeroProduct(): Promise<Product | undefined> {
  const { products } = await loadCatalog();
  return (
    products.find((p) => p.handle === heroHandle()) ??
    products.find((p) => p.status === "OPEN") ??
    products[0]
  );
}

export async function getAllSizes(): Promise<string[]> {
  const { products } = await loadCatalog();
  const sizes = new Set<string>();
  products.forEach((p) =>
    p.variants.forEach((v) =>
      v.selectedOptions
        .filter((o) => o.name === "Size")
        .forEach((o) => sizes.add(o.value)),
    ),
  );
  return Array.from(sizes);
}

/** Open lots first, then closed — the manifest reads as availability. */
export async function getManifest(): Promise<Product[]> {
  const { products } = await loadCatalog();
  return [...products].sort((a, b) => {
    if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
    return a.lotCode.localeCompare(b.lotCode);
  });
}
