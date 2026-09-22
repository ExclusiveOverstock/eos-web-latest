import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/shopify/config";

/**
 * Shopify webhook → drop the catalog cache.
 *
 * This route is the difference between a site that reflects Shopify and one
 * that reflects Shopify as it was at build time. Every page here is
 * statically generated; without something invalidating them, selling the
 * last piece of a lot in the admin would leave `01 REMAINING` on the live
 * site until the next deploy. On a brand whose entire claim is that the
 * counts are real, that is the worst failure the site can have.
 *
 * Subscribe it to `products/update`, `products/delete`, `inventory_levels/update`
 * and `collections/update`. All four land here and drop the same tag —
 * see the note on CATALOG_TAG for why the invalidation is deliberately
 * coarse.
 *
 * There is also a time-based floor (CATALOG_REVALIDATE_SECONDS) on every
 * catalog fetch, so a webhook that is never configured or silently stops
 * firing degrades to "up to a minute stale" rather than "stale forever".
 */

export const runtime = "nodejs";
/** Never prerendered or cached — it exists to have side effects. */
export const dynamic = "force-dynamic";

function verify(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest();
  let received: Buffer;
  try {
    received = Buffer.from(header, "base64");
  } catch {
    return false;
  }

  // Length must match before timingSafeEqual, which throws on a mismatch.
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_REVALIDATE_SECRET;

  /**
   * Refuse rather than accept-everything when unconfigured.
   *
   * An open revalidation endpoint is a free way for anyone to make the site
   * rebuild its catalog on demand, so a missing secret is a 503, not a
   * default-allow.
   */
  if (!secret) {
    return Response.json(
      { revalidated: false, reason: "SHOPIFY_REVALIDATE_SECRET is not set" },
      { status: 503 },
    );
  }

  // The signature is over the exact bytes Shopify sent, so the body has to
  // be read as text and never re-serialised from a parsed object.
  const rawBody = await request.text();

  if (!verify(rawBody, request.headers.get("x-shopify-hmac-sha256"), secret)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  /**
   * Two arguments, not one. Next 16 deprecated the single-argument form,
   * and `updateTag` — which expires immediately — is Server-Action-only and
   * cannot be called from a Route Handler.
   *
   * "max" marks the tag stale and serves stale-while-revalidate, so exactly
   * one request after a webhook may still render the previous count before
   * everything downstream is fresh. That one render is the accepted cost;
   * the failure this route exists to prevent is indefinite staleness, not a
   * single frame of it.
   */
  revalidateTag(CATALOG_TAG, "max");

  return Response.json({
    revalidated: true,
    topic: request.headers.get("x-shopify-topic"),
    at: new Date().toISOString(),
  });
}
