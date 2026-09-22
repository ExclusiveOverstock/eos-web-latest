import type { ImageLoaderProps } from "next/image";

/**
 * Resize Shopify images at Shopify, not here.
 *
 * WHAT THIS FIXES. Next's built-in optimizer downloads the original, resizes
 * it on the server and caches the result. Against this catalog the originals
 * are 6000x4000 — roughly 10MB each — and pulling one across the network just
 * to make a 1200px copy took longer than the optimizer's 7 second budget:
 *
 *   GET /_next/image?url=...purpleplain_1.jpg&w=1200  500 in 7.1s
 *   Error [TimeoutError]: The operation was aborted due to timeout
 *
 * The product page therefore rendered its hero as a broken image while the
 * 128px thumbnail of the very same file loaded fine, because that request was
 * small enough to finish in time.
 *
 * Shopify's CDN already does this transform. Appending `width` to the file URL
 * returns a resized image straight from their edge, so nothing is downloaded,
 * resized or cached by this app at all. It is faster, it cannot time out, and
 * it removes image processing from the server's work entirely.
 *
 * Scoped deliberately: this is passed per `<Image loader>` rather than set
 * globally in next.config, because it only understands Shopify URLs. Local
 * imports — the editorial banner, anything under /public — must keep using the
 * default optimizer, and a global loader would break them.
 */
export function shopifyImageLoader({ src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    // Not an absolute URL — hand it back untouched rather than throwing
    // inside a render.
    return src;
  }
}
