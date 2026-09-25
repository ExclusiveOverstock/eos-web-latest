/**
 * Storefront GraphQL documents, and the shapes they come back as.
 *
 * The response types are hand-written rather than generated. Codegen would
 * be right once the real schema and its metafield definitions exist; before
 * then it would generate against a schema nobody has configured yet, and the
 * surface here is small enough to keep honest by hand.
 */

/**
 * Fields shared by every product read.
 *
 * `quantityAvailable` is the one to watch. It is only populated when
 * inventory tracking is enabled AND the app holds
 * `unauthenticated_read_product_inventory`; without that scope Shopify
 * returns null rather than failing, so the whole scarcity system would go
 * quietly blank. The mapper treats null as "unknown" and falls back to
 * availability, which degrades to "open or closed" rather than to nothing.
 */
const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    options {
      id
      name
      values
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 8) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          sku
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
        }
      }
    }
    collections(first: 10) {
      edges {
        node {
          handle
        }
      }
    }
    metafields(identifiers: $metafields) {
      namespace
      key
      value
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query EosProducts($first: Int!, $metafields: [HasMetafieldsIdentifier!]!) {
    products(first: $first) {
      edges {
        node {
          ...ProductFields
        }
      }
    }
  }
`;

export const PRODUCT_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query EosProduct($handle: String!, $metafields: [HasMetafieldsIdentifier!]!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query EosCollections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
        }
      }
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Response shapes                                                     */
/* ------------------------------------------------------------------ */

export type GqlMoney = { amount: string; currencyCode: string };

export type GqlVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: GqlMoney;
};

export type GqlImage = {
  id: string | null;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type GqlMetafield = {
  namespace: string;
  key: string;
  value: string;
} | null;

export type GqlProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  options: { id: string; name: string; values: string[] }[];
  priceRange: { minVariantPrice: GqlMoney; maxVariantPrice: GqlMoney };
  images: { edges: { node: GqlImage }[] };
  variants: { edges: { node: GqlVariant }[] };
  collections: { edges: { node: { handle: string } }[] };
  metafields: GqlMetafield[];
};

export type GqlCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
};

export type ProductsResponse = { products: { edges: { node: GqlProduct }[] } };
export type ProductResponse = { product: GqlProduct | null };
export type CollectionsResponse = {
  collections: { edges: { node: GqlCollection }[] };
};
