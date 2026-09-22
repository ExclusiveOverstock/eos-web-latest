import {
  CATALOG_REVALIDATE_SECONDS,
  CATALOG_TAG,
  storefrontEndpoint,
  storefrontToken,
} from "./config";

/**
 * Storefront API transport.
 *
 * Server-only. The Storefront token is a public one, but sending it from the
 * browser would put the whole catalog behind the visitor's connection and
 * give up Next's cache entirely, so every catalog read happens during the
 * server render and is cached by tag.
 */

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; path?: (string | number)[] }[];
};

export class StorefrontError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = "StorefrontError";
  }
}

export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = storefrontToken();

  const response = await fetch(storefrontEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // mock.shop takes no token, and sending an empty header to the real
      // API is an auth failure rather than a no-op — so it is omitted
      // entirely rather than sent blank.
      ...(token ? { "X-Shopify-Storefront-Access-Token": token } : {}),
    },
    body: JSON.stringify({ query, variables }),
    next: {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CATALOG_TAG],
    },
  });

  if (!response.ok) {
    throw new StorefrontError(
      `Storefront request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  /**
   * GraphQL reports failures with HTTP 200 and an `errors` array, so this
   * has to be inspected or a broken query looks like a success returning
   * undefined. But errors and data are not mutually exclusive, and treating
   * them as though they were is a real bug — one this hit in production.
   *
   * WHAT HAPPENED: a Storefront token without the inventory scope answers a
   * query containing `quantityAvailable` by returning every product
   * correctly AND an "Access denied" error per variant. The earlier version
   * threw on any error, so twenty perfectly good products became a 500 —
   * defeating the nullable `quantityRemaining` that exists precisely so a
   * missing count degrades to "Available" instead of taking the page down.
   *
   * So: data present means render, whatever else came back. Only a response
   * with no data at all is fatal. Field-level denials are logged once per
   * request rather than per field, because the inventory case produces one
   * for every variant in the catalog and would otherwise bury the log.
   */
  if (payload.errors?.length) {
    const messages = [...new Set(payload.errors.map((e) => e.message))];

    if (!payload.data) {
      throw new StorefrontError(
        `Storefront returned errors: ${messages.join("; ")}`,
        payload.errors,
      );
    }

    console.warn(
      `[storefront] partial response — ${payload.errors.length} field error(s): ${messages.join("; ")}`,
    );
  }

  if (!payload.data) {
    throw new StorefrontError("Storefront returned no data");
  }

  return payload.data;
}

/** Unwraps Shopify's `{ edges: [{ node }] }` pagination envelope. */
export function nodes<T>(connection: { edges: { node: T }[] } | null | undefined): T[] {
  return connection?.edges?.map((edge) => edge.node) ?? [];
}
